import boto3
import json
from datetime import datetime, timedelta

def get_cost_and_usage(ce_client, start_date, end_date):
    """Fetch costs from AWS Cost Explorer."""
    response = ce_client.get_cost_and_usage(
        TimePeriod={
            'Start': start_date,
            'End': end_date
        },
        Granularity='MONTHLY',
        Metrics=['AmortizedCost'],
        GroupBy=[
            {'Type': 'DIMENSION', 'Key': 'SERVICE'},
            {'Type': 'TAG', 'Key': 'Project'}
        ]
    )
    return response['ResultsByTime']

def check_compute_optimizer(compute_optimizer_client):
    """Check AWS Compute Optimizer for right-sizing recommendations."""
    try:
        response = compute_optimizer_client.get_ec2_instance_recommendations()
        recommendations = response.get('instanceRecommendations', [])
        return recommendations
    except Exception as e:
        print(f"Failed to fetch Compute Optimizer data: {e}")
        return []

def main():
    print("Starting AWS Cost Optimization & Resource Management Check...")
    ce_client = boto3.client('ce', region_name='us-east-1')
    co_client = boto3.client('compute-optimizer', region_name='us-east-1')

    # Time frame for cost (Last 30 days)
    end_date = datetime.today().strftime('%Y-%m-%d')
    start_date = (datetime.today() - timedelta(days=30)).strftime('%Y-%m-%d')
    
    print(f"\n--- Cost Analysis ({start_date} to {end_date}) ---")
    costs = get_cost_and_usage(ce_client, start_date, end_date)
    for result in costs:
        groups = result.get('Groups', [])
        for group in groups:
            service = group['Keys'][0]
            tag = group['Keys'][1] if len(group['Keys']) > 1 else 'Untagged'
            amount = group['Metrics']['AmortizedCost']['Amount']
            if float(amount) > 0:
                print(f"Service: {service} | Tag (Project): {tag} | Cost: ${float(amount):.2f}")

    print("\n--- Right-Sizing Recommendations (Compute Optimizer) ---")
    recommendations = check_compute_optimizer(co_client)
    if not recommendations:
        print("No EC2 instances found or Compute Optimizer is disabled.")
    else:
        for rec in recommendations:
            instance_arn = rec.get('instanceArn')
            current_type = rec.get('currentInstanceType')
            findings = rec.get('finding')
            print(f"Instance: {instance_arn} | Current Type: {current_type} | Finding: {findings}")

if __name__ == '__main__':
    main()
