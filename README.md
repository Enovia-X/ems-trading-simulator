# Enoviax Manual Simulator (EMS)
 
The **Enoviax Manual Simulator (EMS)** is a tool designed to help you make more informed trading decisions. It simulates predictions based on technical indicators and psychological market factors.
 
---
 
### **DOT154 Mapping Indicators**
 
* **EMA9 vs WMA50 (Trend)**: Measures market trend direction.
    * **Green (Buy)**: Strong uptrend.
    * **Red (Sell)**: Strong downtrend.
    * **Yellow (Neutral)**: Sideways market.
    * **Light Green (Buy Potential)**: Potential uptrend.
    * **Orange (Sell Potential)**: Potential downtrend.
    * **White (Mixed)**: Unclear signals.
    * **Grey (Neutral)**: Default status.
 
* **BB 20:3 (Bollinger Bands)**: Measures market volatility and identifies overbought/oversold conditions.
 
* **RSI14 (Relative Strength Index)**: A momentum indicator used to identify overbought (>70) or oversold (<30) conditions.
 
* **MACD (Moving Average Convergence Divergence) (12,26,9)**: A trend-following indicator for buy/sell signals and trend confirmation.
 
---
 
### **Scoring System**
 
* **HTS Score (Historical Technical Score)**: The total score from EMA, BB, RSI, and MACD indicators across M15, H1, and H4 timeframes.
    * **Range**: -12 to +12.
 
* **PTS Score (Psychological & Candle Pressure Score)**: A manual score you enter based on your analysis of candlestick patterns.
    * **Range**: -1.0 to +1.0.
 
* **Delta-X Total**: The overall score used for confidence and prediction outcome (**HTS Score** + **PTS Score**).
    * **Range**: -13 to +13.
 
---
 
### **Grail Confidence & Prediction Result**
 
* **90% Confidence**: If Delta-X >= 9 or <= -9
* **70% Confidence**: If Delta-X >= 7 or <= -7
* **50% Confidence**: If Delta-X >= 5 or <= -5
* **30% Confidence**: For other scores
 
* **High Confidence, BUY ENTRY**: Delta-X >= 6 AND HTS >= 6
* **High Confidence, SELL ENTRY**: Delta-X <= -6 AND HTS <= -6
* **Medium Confidence, Potential Entry**: If Delta-X >= 3 or <= -3
* **Low Confidence**: No clear direction.
 
---
 
### **Risk Heatmap**
 
This heatmap visualizes risk or opportunity levels.
* **Bright Green (0-3)**: Very Low Risk / High Opportunity (Buy).
* **Yellow (4)**: Neutral Risk / No clear direction.
* **Red (5-9)**: High Risk / Poor Opportunity (Sell).
 
---
 
### **Contact Us**
 
Got a question or a suggestion? We'd love to hear from you! Please reach out to us at:
 
* **Email**: zulkarnain-x@proton.me
* **Phone**: +60 16-7111107
