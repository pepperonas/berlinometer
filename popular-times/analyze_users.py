#!/usr/bin/env python3

import os
import sys
import json
import re
from datetime import datetime, timedelta
from collections import defaultdict, Counter
from pathlib import Path

class BerlinometerAnalytics:
    def __init__(self, log_file_path, output_dir):
        self.log_file_path = log_file_path
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        
        # Create subdirectories
        (self.output_dir / 'reports').mkdir(exist_ok=True)
        (self.output_dir / 'charts').mkdir(exist_ok=True)
        (self.output_dir / 'data').mkdir(exist_ok=True)
        
        self.today = datetime.now().strftime('%Y-%m-%d')
        
    def parse_access_log(self):
        """Parse access.log and extract user data"""
        users_data = []
        daily_stats = defaultdict(lambda: {
            'unique_users': set(),
            'total_requests': 0,
            'endpoints': Counter(),
            'user_agents': Counter(),
            'countries': Counter()
        })
        
        if not os.path.exists(self.log_file_path):
            print(f"❌ Access log not found: {self.log_file_path}")
            return users_data, daily_stats
            
        print(f"📊 Parsing access log: {self.log_file_path}")
        
        with open(self.log_file_path, 'r', encoding='utf-8') as f:
            for line_num, line in enumerate(f, 1):
                try:
                    parts = line.strip().split(' | ')
                    if len(parts) >= 5:
                        timestamp_str = parts[0]
                        ip = parts[1]
                        country = parts[2] if parts[2] != 'unknown' else 'Unknown'
                        city = parts[3] if parts[3] != 'unknown' else 'Unknown'
                        endpoint = parts[4]
                        user_agent = parts[5] if len(parts) > 5 else 'Unknown'
                        
                        # Parse timestamp
                        timestamp = datetime.strptime(timestamp_str, '%Y-%m-%d %H:%M:%S')
                        date_str = timestamp.strftime('%Y-%m-%d')
                        
                        # Store individual request data
                        users_data.append({
                            'timestamp': timestamp,
                            'date': date_str,
                            'ip': ip,
                            'country': country,
                            'city': city,
                            'endpoint': endpoint,
                            'user_agent': user_agent
                        })
                        
                        # Update daily stats
                        daily_stats[date_str]['unique_users'].add(ip)
                        daily_stats[date_str]['total_requests'] += 1
                        daily_stats[date_str]['endpoints'][endpoint] += 1
                        daily_stats[date_str]['user_agents'][user_agent] += 1
                        daily_stats[date_str]['countries'][country] += 1
                        
                except Exception as e:
                    print(f"⚠️ Error parsing line {line_num}: {e}")
                    continue
        
        print(f"✅ Parsed {len(users_data)} requests from {len(daily_stats)} days")
        return users_data, daily_stats
    
    def analyze_user_metrics(self, users_data, daily_stats):
        """Analyze user metrics and trends"""
        if not daily_stats:
            return {}
            
        # Convert daily stats to proper format
        analytics = {
            'dates': [],
            'unique_users': [],
            'total_requests': [],
            'new_users': [],
            'returning_users': [],
            'user_retention': []
        }
        
        all_seen_users = set()
        previous_day_users = set()
        
        for date in sorted(daily_stats.keys()):
            day_data = daily_stats[date]
            day_users = day_data['unique_users']
            
            # Calculate new vs returning users
            new_users = day_users - all_seen_users
            returning_users = day_users - new_users
            
            # Calculate retention rate (users who came back from previous day)
            if previous_day_users:
                retention_rate = len(day_users & previous_day_users) / len(previous_day_users) * 100
            else:
                retention_rate = 0
            
            analytics['dates'].append(datetime.strptime(date, '%Y-%m-%d'))
            analytics['unique_users'].append(len(day_users))
            analytics['total_requests'].append(day_data['total_requests'])
            analytics['new_users'].append(len(new_users))
            analytics['returning_users'].append(len(returning_users))
            analytics['user_retention'].append(retention_rate)
            
            # Update sets for next iteration
            all_seen_users.update(day_users)
            previous_day_users = day_users.copy()
        
        return analytics
    
    def prepare_chart_data(self, analytics, daily_stats):
        """Prepare data for Chart.js charts"""
        if not analytics or not analytics['dates']:
            print("❌ No data available for charts")
            return {}
            
        # Convert dates to strings for JSON serialization
        chart_data = {
            'daily_users': {
                'labels': [d.strftime('%Y-%m-%d') for d in analytics['dates']],
                'datasets': [
                    {
                        'label': 'Unique Users',
                        'data': analytics['unique_users'],
                        'borderColor': '#667eea',
                        'backgroundColor': 'rgba(102, 126, 234, 0.1)',
                        'tension': 0.4,
                        'fill': True
                    }
                ]
            },
            'new_vs_returning': {
                'labels': [d.strftime('%Y-%m-%d') for d in analytics['dates']],
                'datasets': [
                    {
                        'label': 'New Users',
                        'data': analytics['new_users'],
                        'backgroundColor': '#a855f7',
                        'borderColor': '#a855f7',
                        'borderWidth': 1
                    },
                    {
                        'label': 'Returning Users',
                        'data': analytics['returning_users'],
                        'backgroundColor': '#10b981',
                        'borderColor': '#10b981',
                        'borderWidth': 1
                    }
                ]
            },
            'total_requests': {
                'labels': [d.strftime('%Y-%m-%d') for d in analytics['dates']],
                'datasets': [
                    {
                        'label': 'Total Requests',
                        'data': analytics['total_requests'],
                        'borderColor': '#f59e0b',
                        'backgroundColor': 'rgba(245, 158, 11, 0.1)',
                        'tension': 0.4,
                        'fill': True
                    }
                ]
            },
            'retention_rate': {
                'labels': [d.strftime('%Y-%m-%d') for d in analytics['dates']],
                'datasets': [
                    {
                        'label': 'Retention Rate (%)',
                        'data': analytics['user_retention'],
                        'borderColor': '#ef4444',
                        'backgroundColor': 'rgba(239, 68, 68, 0.1)',
                        'tension': 0.4,
                        'fill': True
                    }
                ]
            }
        }
        
        # Add top endpoints chart data
        if daily_stats:
            all_endpoints = Counter()
            for day_data in daily_stats.values():
                all_endpoints.update(day_data['endpoints'])
            
            if all_endpoints:
                top_endpoints = all_endpoints.most_common(10)
                chart_data['top_endpoints'] = {
                    'labels': [ep[0] for ep in top_endpoints],
                    'datasets': [
                        {
                            'label': 'Requests',
                            'data': [ep[1] for ep in top_endpoints],
                            'backgroundColor': [
                                '#667eea', '#764ba2', '#f093fb', '#f5576c',
                                '#4facfe', '#00f2fe', '#43e97b', '#38f9d7',
                                '#ffecd2', '#fcb69f'
                            ][:len(top_endpoints)],
                            'borderWidth': 1
                        }
                    ]
                }
        
        # Add countries chart data
        all_countries = Counter()
        for day_data in daily_stats.values():
            all_countries.update(day_data['countries'])
        
        if all_countries:
            top_countries = all_countries.most_common(5)
            chart_data['top_countries'] = {
                'labels': [country[0] for country in top_countries],
                'datasets': [
                    {
                        'label': 'Requests',
                        'data': [country[1] for country in top_countries],
                        'backgroundColor': [
                            '#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe'
                        ][:len(top_countries)],
                        'borderWidth': 1
                    }
                ]
            }
        
        return chart_data
    
    def create_html_report(self, analytics, daily_stats, chart_data):
        """Create comprehensive HTML report"""
        if not analytics:
            print("❌ No analytics data for report")
            return None
            
        # Calculate summary statistics
        total_unique_users = len(set().union(*[day['unique_users'] for day in daily_stats.values()]))
        total_requests = sum(analytics['total_requests'])
        avg_daily_users = sum(analytics['unique_users']) / len(analytics['unique_users']) if analytics['unique_users'] else 0
        avg_retention = sum(analytics['user_retention']) / len(analytics['user_retention']) if analytics['user_retention'] else 0
        
        # Get top countries
        all_countries = Counter()
        for day_data in daily_stats.values():
            all_countries.update(day_data['countries'])
        top_countries = all_countries.most_common(5)
        
        html_content = f"""
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Berlinometer Analytics Report - {self.today}</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }}
        .container {{
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            overflow: hidden;
        }}
        .header {{
            background: linear-gradient(135deg, #2B2E3B 0%, #343845 100%);
            color: white;
            padding: 2rem;
            text-align: center;
        }}
        .header h1 {{
            margin: 0;
            font-size: 2.5rem;
            font-weight: 300;
        }}
        .header p {{
            margin: 10px 0 0 0;
            opacity: 0.8;
            font-size: 1.1rem;
        }}
        .content {{
            padding: 2rem;
        }}
        .metrics-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 2rem;
        }}
        .metric-card {{
            background: #f8f9fa;
            border-radius: 10px;
            padding: 1.5rem;
            text-align: center;
            border-left: 4px solid #667eea;
        }}
        .metric-value {{
            font-size: 2.5rem;
            font-weight: bold;
            color: #2B2E3B;
            margin: 0;
        }}
        .metric-label {{
            color: #666;
            margin: 5px 0 0 0;
            font-size: 0.9rem;
            text-transform: uppercase;
            letter-spacing: 1px;
        }}
        .chart-container {{
            margin: 2rem 0;
            background: white;
            padding: 1.5rem;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }}
        .chart-wrapper {{
            position: relative;
            height: 400px;
            margin: 1rem 0;
        }}
        .chart-grid {{
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 2rem;
            margin: 2rem 0;
        }}
        @media (max-width: 768px) {{
            .chart-grid {{
                grid-template-columns: 1fr;
            }}
        }}
        .table-container {{
            margin: 2rem 0;
            overflow-x: auto;
        }}
        table {{
            width: 100%;
            border-collapse: collapse;
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }}
        th, td {{
            padding: 12px 15px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }}
        th {{
            background: #2B2E3B;
            color: white;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-size: 0.8rem;
        }}
        tr:hover {{
            background: #f5f5f5;
        }}
        .section-title {{
            font-size: 1.8rem;
            color: #2B2E3B;
            margin: 2rem 0 1rem 0;
            border-bottom: 2px solid #667eea;
            padding-bottom: 10px;
        }}
        .footer {{
            background: #f8f9fa;
            padding: 1rem 2rem;
            text-align: center;
            color: #666;
            border-top: 1px solid #eee;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🍷 Berlinometer Analytics</h1>
            <p>Daily Usage Report - {self.today}</p>
        </div>
        
        <div class="content">
            <div class="metrics-grid">
                <div class="metric-card">
                    <div class="metric-value">{total_unique_users}</div>
                    <div class="metric-label">Total Unique Users</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">{total_requests:,}</div>
                    <div class="metric-label">Total Requests</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">{avg_daily_users:.1f}</div>
                    <div class="metric-label">Avg Daily Users</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">{avg_retention:.1f}%</div>
                    <div class="metric-label">Avg Retention Rate</div>
                </div>
            </div>
        """
        
        # Add charts section with Chart.js
        html_content += f"""
            <h2 class="section-title">📈 Analytics Charts</h2>
            
            <div class="chart-container">
                <h3>Daily Unique Users</h3>
                <div class="chart-wrapper">
                    <canvas id="dailyUsersChart"></canvas>
                </div>
            </div>
            
            <div class="chart-grid">
                <div class="chart-container">
                    <h3>New vs Returning Users</h3>
                    <div class="chart-wrapper">
                        <canvas id="newVsReturningChart"></canvas>
                    </div>
                </div>
                
                <div class="chart-container">
                    <h3>Total Requests</h3>
                    <div class="chart-wrapper">
                        <canvas id="totalRequestsChart"></canvas>
                    </div>
                </div>
            </div>
            
            <div class="chart-grid">
                <div class="chart-container">
                    <h3>User Retention Rate</h3>
                    <div class="chart-wrapper">
                        <canvas id="retentionChart"></canvas>
                    </div>
                </div>
                
                <div class="chart-container">
                    <h3>Top Countries</h3>
                    <div class="chart-wrapper">
                        <canvas id="countriesChart"></canvas>
                    </div>
                </div>
            </div>
            
            <div class="chart-container">
                <h3>Most Popular Endpoints</h3>
                <div class="chart-wrapper">
                    <canvas id="endpointsChart"></canvas>
                </div>
            </div>
            """
        
        # Add daily statistics table
        html_content += f"""
            <h2 class="section-title">📊 Daily Statistics</h2>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Unique Users</th>
                            <th>Total Requests</th>
                            <th>New Users</th>
                            <th>Returning Users</th>
                            <th>Retention Rate</th>
                        </tr>
                    </thead>
                    <tbody>
        """
        
        for i, date in enumerate(analytics['dates']):
            date_str = date.strftime('%Y-%m-%d')
            html_content += f"""
                        <tr>
                            <td>{date_str}</td>
                            <td>{analytics['unique_users'][i]}</td>
                            <td>{analytics['total_requests'][i]:,}</td>
                            <td>{analytics['new_users'][i]}</td>
                            <td>{analytics['returning_users'][i]}</td>
                            <td>{analytics['user_retention'][i]:.1f}%</td>
                        </tr>
            """
        
        # Add top countries table
        html_content += f"""
                    </tbody>
                </table>
            </div>
            
            <h2 class="section-title">🌍 Top Countries</h2>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Country</th>
                            <th>Total Requests</th>
                        </tr>
                    </thead>
                    <tbody>
        """
        
        for country, count in top_countries:
            html_content += f"""
                        <tr>
                            <td>{country}</td>
                            <td>{count:,}</td>
                        </tr>
            """
        
        html_content += f"""
                    </tbody>
                </table>
            </div>
        </div>
        
        <div class="footer">
            <p>📊 Generated by Berlinometer Analytics System - {datetime.now()}</p>
        </div>
    </div>
    
    <script>
        // Chart.js configuration
        Chart.defaults.font.family = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
        Chart.defaults.color = '#2B2E3B';
        
        const chartData = {json.dumps(chart_data, indent=8)};
        
        // Daily Users Chart
        new Chart(document.getElementById('dailyUsersChart'), {{
            type: 'line',
            data: chartData.daily_users,
            options: {{
                responsive: true,
                maintainAspectRatio: false,
                scales: {{
                    y: {{
                        beginAtZero: true,
                        ticks: {{
                            precision: 0
                        }}
                    }}
                }},
                plugins: {{
                    legend: {{
                        display: false
                    }}
                }}
            }}
        }});
        
        // New vs Returning Users Chart
        new Chart(document.getElementById('newVsReturningChart'), {{
            type: 'bar',
            data: chartData.new_vs_returning,
            options: {{
                responsive: true,
                maintainAspectRatio: false,
                scales: {{
                    y: {{
                        beginAtZero: true,
                        ticks: {{
                            precision: 0
                        }}
                    }}
                }}
            }}
        }});
        
        // Total Requests Chart
        new Chart(document.getElementById('totalRequestsChart'), {{
            type: 'line',
            data: chartData.total_requests,
            options: {{
                responsive: true,
                maintainAspectRatio: false,
                scales: {{
                    y: {{
                        beginAtZero: true,
                        ticks: {{
                            precision: 0
                        }}
                    }}
                }},
                plugins: {{
                    legend: {{
                        display: false
                    }}
                }}
            }}
        }});
        
        // Retention Rate Chart
        new Chart(document.getElementById('retentionChart'), {{
            type: 'line',
            data: chartData.retention_rate,
            options: {{
                responsive: true,
                maintainAspectRatio: false,
                scales: {{
                    y: {{
                        beginAtZero: true,
                        max: 100,
                        ticks: {{
                            callback: function(value) {{
                                return value + '%';
                            }}
                        }}
                    }}
                }},
                plugins: {{
                    legend: {{
                        display: false
                    }}
                }}
            }}
        }});
        
        // Top Countries Chart (if data exists)
        if (chartData.top_countries) {{
            new Chart(document.getElementById('countriesChart'), {{
                type: 'doughnut',
                data: chartData.top_countries,
                options: {{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {{
                        legend: {{
                            position: 'bottom'
                        }}
                    }}
                }}
            }});
        }}
        
        // Top Endpoints Chart (if data exists)
        if (chartData.top_endpoints) {{
            new Chart(document.getElementById('endpointsChart'), {{
                type: 'bar',
                data: chartData.top_endpoints,
                options: {{
                    responsive: true,
                    maintainAspectRatio: false,
                    indexAxis: 'y',
                    scales: {{
                        x: {{
                            beginAtZero: true,
                            ticks: {{
                                precision: 0
                            }}
                        }}
                    }},
                    plugins: {{
                        legend: {{
                            display: false
                        }}
                    }}
                }}
            }});
        }}
    </script>
</body>
</html>
        """
        
        # Save HTML report
        report_file = self.output_dir / 'reports' / f'analytics_report_{self.today}.html'
        with open(report_file, 'w', encoding='utf-8') as f:
            f.write(html_content)
        
        return report_file
    
    def save_daily_data(self, analytics, daily_stats):
        """Save daily data as JSON for historical tracking"""
        data = {
            'date': self.today,
            'generated_at': datetime.now().isoformat(),
            'analytics': {
                'dates': [d.isoformat() for d in analytics['dates']] if analytics['dates'] else [],
                'unique_users': analytics['unique_users'],
                'total_requests': analytics['total_requests'],
                'new_users': analytics['new_users'],
                'returning_users': analytics['returning_users'],
                'user_retention': analytics['user_retention']
            },
            'summary': {
                'total_unique_users': len(set().union(*[day['unique_users'] for day in daily_stats.values()])) if daily_stats else 0,
                'total_requests': sum(analytics['total_requests']) if analytics['total_requests'] else 0,
                'avg_daily_users': sum(analytics['unique_users']) / len(analytics['unique_users']) if analytics['unique_users'] else 0,
                'avg_retention': sum(analytics['user_retention']) / len(analytics['user_retention']) if analytics['user_retention'] else 0
            }
        }
        
        data_file = self.output_dir / 'data' / f'analytics_data_{self.today}.json'
        with open(data_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        return data_file
    
    def run_analysis(self):
        """Run complete analysis"""
        print(f"🚀 Starting Berlinometer Analytics for {self.today}")
        print("="*60)
        
        # Parse access log
        users_data, daily_stats = self.parse_access_log()
        
        if not daily_stats:
            print("❌ No data found in access log")
            return False
        
        # Analyze metrics
        analytics = self.analyze_user_metrics(users_data, daily_stats)
        
        # Prepare chart data for Chart.js
        chart_data = self.prepare_chart_data(analytics, daily_stats)
        
        # Create HTML report
        report_file = self.create_html_report(analytics, daily_stats, chart_data)
        
        # Save daily data
        data_file = self.save_daily_data(analytics, daily_stats)
        
        # Print summary
        print("✅ Analysis completed successfully!")
        print(f"📊 HTML Report: {report_file}")
        print(f"📈 Interactive Charts: Chart.js integration complete")
        print(f"💾 Data saved: {data_file}")
        print("="*60)
        
        return True

def main():
    # Configuration
    script_dir = os.path.dirname(os.path.abspath(__file__))
    log_file = os.path.join(script_dir, 'access.log')
    output_dir = os.path.join(script_dir, 'analytics')
    
    # Run analytics
    analyzer = BerlinometerAnalytics(log_file, output_dir)
    success = analyzer.run_analysis()
    
    if success:
        print("🎉 Berlinometer Analytics completed successfully!")
    else:
        print("❌ Analytics failed!")
        sys.exit(1)

if __name__ == "__main__":
    main()