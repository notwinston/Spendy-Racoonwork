import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../../constants';
import { Card } from '../ui/Card';
import { AIInsightCard } from '../AIInsightCard';
import { AnomalyBanner } from '../AnomalyBanner';
import { BillCalendarView } from '../BillCalendarView';
import { SmartBudgetSuggestion } from '../SmartBudgetSuggestion';
import { useTransactionStore, getCategoryMoM } from '../../stores/transactionStore';
import { useBudgetStore, suggestCategoryBudgets } from '../../stores/budgetStore';
import { detectAnomalies, predictBills } from '../../stores/predictionStore';

const PERSONALITY_MAP: Record<string, { name: string; emoji: string; description: string }> = {
  dining: { name: 'The Foodie', emoji: '\uD83C\uDF7D\uFE0F', description: 'You love dining out and exploring restaurants' },
  entertainment: { name: 'The Entertainer', emoji: '\uD83C\uDFAC', description: 'Entertainment is your go-to spending category' },
  shopping: { name: 'The Shopaholic', emoji: '\uD83D\uDECD\uFE0F', description: 'You enjoy retail therapy and shopping' },
  groceries: { name: 'The Home Chef', emoji: '\uD83E\uDDD1\u200D\uD83C\uDF73', description: 'You invest in quality groceries and cooking' },
  travel: { name: 'The Explorer', emoji: '\u2708\uFE0F', description: 'Travel and adventure are your priorities' },
  fitness: { name: 'The Athlete', emoji: '\uD83C\uDFCB\uFE0F', description: 'Fitness and health are top priorities for you' },
  transport: { name: 'The Commuter', emoji: '\uD83D\uDE97', description: 'You spend significantly on transportation' },
  health: { name: 'The Wellness Guru', emoji: '\uD83E\uDDD8', description: 'Health and wellness drive your spending' },
  bills: { name: 'The Responsible One', emoji: '\uD83D\uDCB3', description: 'Bills and utilities are your biggest expense' },
  education: { name: 'The Scholar', emoji: '\uD83D\uDCDA', description: 'You invest heavily in education and learning' },
};

export function InsightsInsights() {
  const { transactions, recurringTransactions } = useTransactionStore();
  const { totalBudget, totalSpent, budgets } = useBudgetStore();

  const categoryMoM = useMemo(() => getCategoryMoM(transactions), [transactions]);

  // ---------- Anomaly Detection (using predictive store function) ----------
  const anomalies = useMemo(() => detectAnomalies(transactions), [transactions]);

  // ---------- Predicted Bills ----------
  const predictedBills = useMemo(
    () => predictBills(recurringTransactions),
    [recurringTransactions],
  );

  // ---------- Smart Budget Suggestions ----------
  const budgetSuggestions = useMemo(
    () => suggestCategoryBudgets(transactions, budgets),
    [transactions, budgets],
  );

  // ---------- Account Split Analysis ----------
  const accountSpend = useMemo(() => {
    const byAccount: Record<string, { name: string; amount: number }> = {};
    let total = 0;

    transactions.forEach((t) => {
      const accountId = t.account_id || 'primary';
      const accountName = t.account_id ? `Account ${t.account_id.slice(-4)}` : 'Primary Account';
      if (!byAccount[accountId]) {
        byAccount[accountId] = { name: accountName, amount: 0 };
      }
      byAccount[accountId].amount += Math.abs(t.amount);
      total += Math.abs(t.amount);
    });

    return Object.values(byAccount)
      .map((a) => ({
        ...a,
        percentage: total > 0 ? (a.amount / total) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [transactions]);

  const totalAccountSpend = useMemo(
    () => accountSpend.reduce((sum, a) => sum + a.amount, 0),
    [accountSpend],
  );

  // ---------- Spending Personality ----------
  const personality = useMemo(() => {
    if (categoryMoM.length === 0) return null;
    const topCategory = categoryMoM[0].category;
    return PERSONALITY_MAP[topCategory] || {
      name: 'The Balanced Spender',
      emoji: '\u2696\uFE0F',
      description: 'Your spending is well-distributed across categories',
    };
  }, [categoryMoM]);

  // ---------- Improvement Suggestions ----------
  const suggestions = useMemo(() => {
    const tips: { title: string; body: string; type: 'warning' | 'opportunity' | 'win' }[] = [];

    // Check for overspent categories
    budgets.forEach((b) => {
      if (b.spent > b.monthly_limit) {
        tips.push({
          title: `${b.category.charAt(0).toUpperCase() + b.category.slice(1)} Over Budget`,
          body: `You've spent $${b.spent.toFixed(0)} of your $${b.monthly_limit} budget. Consider reviewing your ${b.category} expenses.`,
          type: 'warning',
        });
      }
    });

    // Check for subscription savings
    const subscriptionTotal = recurringTransactions
      .filter((r) => r.is_active && r.frequency === 'monthly')
      .reduce((sum, r) => sum + r.avg_amount, 0);

    if (subscriptionTotal > 50) {
      tips.push({
        title: 'Subscription Savings',
        body: `You have $${subscriptionTotal.toFixed(0)}/month in recurring subscriptions. Review them to find potential savings of $${(subscriptionTotal * 0.3).toFixed(0)}/month.`,
        type: 'opportunity',
      });
    }

    // Positive reinforcement
    const underBudgetCats = budgets.filter((b) => b.percentUsed < 80 && b.spent > 0);
    if (underBudgetCats.length > 0) {
      tips.push({
        title: 'Budget Win',
        body: `You're under budget in ${underBudgetCats.length} categories. Keep it up!`,
        type: 'win',
      });
    }

    return tips.slice(0, 3);
  }, [budgets, recurringTransactions]);

  // ---------- Recurring Expenses ----------
  const recurringByFrequency = useMemo(() => {
    const grouped: Record<string, typeof recurringTransactions> = {};
    recurringTransactions
      .filter((r) => r.is_active)
      .forEach((r) => {
        if (!grouped[r.frequency]) grouped[r.frequency] = [];
        grouped[r.frequency].push(r);
      });
    return grouped;
  }, [recurringTransactions]);

  const frequencyLabels: Record<string, string> = {
    weekly: 'Weekly',
    biweekly: 'Bi-weekly',
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    yearly: 'Yearly',
  };

  return (
    <View>
      {/* Anomaly Detection */}
      <Text style={styles.sectionTitle}>Anomaly Detection</Text>
      <AnomalyBanner anomalies={anomalies} />
      {anomalies.length === 0 && (
        <Card>
          <View style={styles.emptyRow}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.positive} />
            <Text style={styles.emptyText}>No spending anomalies detected</Text>
          </View>
        </Card>
      )}

      {/* Account Split Analysis */}
      <Text style={styles.sectionTitle}>Account Split</Text>
      <Card>
        {accountSpend.map((account) => (
          <View key={account.name} style={styles.accountRow}>
            <Text style={styles.accountName}>{account.name}</Text>
            <View style={styles.accountBarContainer}>
              <View style={styles.accountBarBg}>
                <View
                  style={[
                    styles.accountBarFill,
                    {
                      width: `${Math.min(100, account.percentage)}%`,
                    },
                  ]}
                />
              </View>
            </View>
            <Text style={styles.accountAmount}>
              ${account.amount.toFixed(0)}
            </Text>
            <Text style={styles.accountPct}>
              {account.percentage.toFixed(0)}%
            </Text>
          </View>
        ))}
        {accountSpend.length === 0 && (
          <Text style={styles.emptyText}>No account data available</Text>
        )}
      </Card>

      {/* Spending Personality */}
      <Text style={styles.sectionTitle}>Spending Personality</Text>
      <Card style={styles.personalityCard}>
        {personality && (
          <>
            <Text style={styles.personalityEmoji}>{personality.emoji}</Text>
            <Text style={styles.personalityName}>{personality.name}</Text>
            <Text style={styles.personalityDesc}>{personality.description}</Text>
            {categoryMoM.length > 0 && (
              <Text style={styles.personalityBasis}>
                Based on your top category:{' '}
                <Text style={styles.personalityCategory}>
                  {categoryMoM[0].category.charAt(0).toUpperCase() + categoryMoM[0].category.slice(1)}
                </Text>
              </Text>
            )}
          </>
        )}
      </Card>

      {/* Smart Budget Suggestions */}
      {budgetSuggestions.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Budget Suggestions</Text>
          {budgetSuggestions.slice(0, 3).map((suggestion) => (
            <SmartBudgetSuggestion
              key={suggestion.category}
              category={suggestion.category}
              currentBudget={suggestion.currentBudget}
              suggestedBudget={suggestion.suggestedBudget}
              reason={suggestion.reason}
            />
          ))}
        </>
      )}

      {/* Improvement Suggestions */}
      <Text style={styles.sectionTitle}>Suggestions</Text>
      {suggestions.length > 0 ? (
        suggestions.map((suggestion, idx) => (
          <AIInsightCard
            key={idx}
            type={suggestion.type}
            title={suggestion.title}
            body={suggestion.body}
          />
        ))
      ) : (
        <AIInsightCard
          type="win"
          title="Looking Good"
          body="No specific suggestions right now. Your spending patterns are healthy!"
        />
      )}

      {/* Upcoming Bills Calendar */}
      {predictedBills.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Bill Calendar</Text>
          <Card>
            <BillCalendarView bills={predictedBills} />
          </Card>
        </>
      )}

      {/* Recurring Expenses */}
      <Text style={styles.sectionTitle}>Recurring Expenses</Text>
      <Card>
        {Object.entries(recurringByFrequency).length > 0 ? (
          Object.entries(recurringByFrequency).map(([frequency, items]) => (
            <View key={frequency} style={styles.recurringGroup}>
              <Text style={styles.recurringFrequency}>
                {frequencyLabels[frequency] || frequency}
              </Text>
              {items.map((item) => (
                <View key={item.id} style={styles.recurringRow}>
                  <Text style={styles.recurringName}>{item.merchant_name}</Text>
                  <Text style={styles.recurringAmount}>
                    ${item.avg_amount.toFixed(2)}
                  </Text>
                </View>
              ))}
            </View>
          ))
        ) : (
          <View style={styles.emptyRow}>
            <Ionicons name="repeat" size={18} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No recurring transactions detected</Text>
          </View>
        )}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    ...Typography.heading.h2,
    fontSize: Typography.sizes.xl,
    color: Colors.textPrimary,
    marginTop: Spacing['2xl'],
    marginBottom: Spacing.md,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  accountName: {
    ...Typography.body.small,
    color: Colors.textPrimary,
    width: 100,
  },
  accountBarContainer: {
    flex: 1,
    marginHorizontal: Spacing.sm,
  },
  accountBarBg: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  accountBarFill: {
    height: '100%',
    backgroundColor: Colors.accentBright,
    borderRadius: 3,
  },
  accountAmount: {
    ...Typography.numeric.inlineValue,
    width: 60,
    textAlign: 'right',
  },
  accountPct: {
    ...Typography.caption.meta,
    color: Colors.textMuted,
    width: 36,
    textAlign: 'right',
  },
  personalityCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  personalityEmoji: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  personalityName: {
    ...Typography.heading.h2,
    color: Colors.textPrimary,
    fontSize: Typography.sizes.xl,
    marginBottom: Spacing.xs,
  },
  personalityDesc: {
    ...Typography.body.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  personalityBasis: {
    ...Typography.caption.meta,
    color: Colors.textMuted,
    marginTop: Spacing.md,
  },
  personalityCategory: {
    color: Colors.accentBright,
    fontWeight: Typography.weights.semibold,
  },
  recurringGroup: {
    marginBottom: Spacing.lg,
  },
  recurringFrequency: {
    ...Typography.label.sectionDivider,
    marginBottom: Spacing.sm,
  },
  recurringRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  recurringName: {
    ...Typography.body.regular,
    color: Colors.textPrimary,
  },
  recurringAmount: {
    ...Typography.numeric.inlineValue,
  },
  emptyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    justifyContent: 'center',
  },
  emptyText: {
    ...Typography.body.regular,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});
