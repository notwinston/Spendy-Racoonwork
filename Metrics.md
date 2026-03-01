
Metrics (To be Calculated)

Core Financial Metrics:
Current balance
Net cash flow (Total income and total expenses)
Monthly Spending (Sum of all expenses)
Percentage change in monthly spending
Categories related:
Category spending
Category spending rate

Predictive Forecast Metric
Forecast balance (Current balance + Predicted deposit - predicted expenses)
Projected monthly spend
Event cost prediction (Avg historical spend for similar events)
Predicted Recurring Expenses (ML model: merchant + amount + cadence clustering)
Subscription Tracker (Detected recurring charges by merchant)
Upcoming Bill Alerts (Predicted transaction date − Today < threshold days) 

Other Financial Health Indexes & Scores:
Savings ratio
Safe to save index (Net cash flow - buffer reserve - upcoming bills)
Safe to spend index (Estimated income - (Fixed expenses + Saving goals))
Financial health score (e.g: Weighted composite of: Savings Ratio (30%) + Debt-to-Income (25%) + Emergency Fund Coverage (25%) + Spending Consistency (20%))
Emergency Fund Coverage (Liquid Savings / Average Monthly Expenses)
Budget Adherence Score (1 − (Actual Spend / Budgeted Spend − 1) clamped to [0,1]) 
Age of Money (Average days between money arriving and being spent) 
Spend Velocity (Running spend rate vs. budget pacing)
Discretionary Ratio (Discretionary Spend / Total Spend × 100)
Cash Flow Forecast Confidence (1 − (Prediction Error / Predicted Amount), rolling 30-day) 
Extra health index: impulse score (anomaly transactions / total transactions)


Goal & Planning Metrics (Additional from Document):
	-Goal Progress % (Amount Saved / Goal Target × 100)
	-Goal ETA (Remaining Amount / Monthly Contribution Rate)
	-Required Monthly Contribution ((Goal Amount − Saved) / Months Until Target Date)
	-Savings Goal Impact on Safe-to-Spend (Income − Fixed Expenses − Sum(Goal Contributions))
	-Goal Conflict Detector (If Sum(Required Contributions) > Safe-to-Save Index)
	-Surplus Auto-Save Suggestion (Safe-to-Save Index × (1 − Risk Buffer %))

Savings Ratio = 
Safe to spend index = Total Estimated Income - (Sum of fixed expenses + Sum of targeted Saving Goals)

