import * as cdk from "aws-cdk-lib";
import {
  aws_lambda as lambda,
  aws_events as events,
  aws_events_targets as targets,
  aws_iam as iam,
  aws_secretsmanager as secretsmanager,
} from "aws-cdk-lib";

import { Construct } from "constructs";

export class InfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const ibAccountId = secretsmanager.Secret.fromSecretNameV2(
      this,
      "secretsmanager-ibAccountId",
      "ibAccountId"
    );
    const ibAPIToken = secretsmanager.Secret.fromSecretNameV2(
      this,
      "secretsmanager-ibAPIToken",
      "ibAPIToken"
    );

    const lambdaFunction = new lambda.Function(this, "Lambda", {
      runtime: lambda.Runtime.PYTHON_3_12,
      handler: "main.handler",
      code: lambda.Code.fromAsset("lambda"),
      environment: {
        IB_ACCOUNT_ID_ARN: ibAccountId.secretArn,
        IB_API_TOKEN: ibAPIToken.secretArn,
      },
    });

    ibAccountId.grantRead(lambdaFunction);
    ibAPIToken.grantRead(lambdaFunction);

    lambdaFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["ses:SendEmail", "ses:SendRawEmail"],
        resources: ["*"],
      })
    );

    new events.Rule(this, "event", {
      schedule: events.Schedule.cron({ minute: "0", hour: "0" }),
      targets: [new targets.LambdaFunction(lambdaFunction)],
    });
  }
}
