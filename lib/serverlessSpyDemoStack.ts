import * as cdk from 'aws-cdk-lib';
import {Construct} from 'constructs';
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as nodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as events from "aws-cdk-lib/aws-events";
import * as eventsTargets from "aws-cdk-lib/aws-events-targets";
import {Statement} from "cdk-iam-floyd";
import {ServerlessSpy} from "serverless-spy";

export class ServerlessSpyDemoStack extends cdk.Stack {
	constructor(scope: Construct, id: string, props?: cdk.StackProps) {
		super(scope, id, props);

		const customEventBus = new events.EventBus(this, 'CustomEventBus');
		new cdk.CfnOutput(this, 'CustomEventBusName', {value: customEventBus.eventBusName});

		const dataTable = new dynamodb.Table(this, 'DataTable', {
			billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
			partitionKey: {name: 'pk', type: dynamodb.AttributeType.STRING},
			sortKey: {name: 'sk', type: dynamodb.AttributeType.STRING},
			removalPolicy: cdk.RemovalPolicy.DESTROY,
		});

		const processingLambda = new nodejs.NodejsFunction(this, 'ProcessingLambda', {
			runtime: lambda.Runtime.NODEJS_20_X,
			entry: 'lambda/index.ts',
			timeout: cdk.Duration.seconds(10),
			environment: {
				TABLE_NAME: dataTable.tableName,
				EVENT_BUS_NAME: customEventBus.eventBusName,
			},
		});

		dataTable.grantWriteData(processingLambda);
		processingLambda.addToRolePolicy(new Statement.Events().toPutEvents())

		new events.Rule(this, 'InvokeProcessingLambda', {
			eventBus: customEventBus,
			eventPattern: {
				source: ['ServerlessSpyDemo'],
				detailType: ['EventA'],
			},
			targets: [new eventsTargets.LambdaFunction(processingLambda)],
		});

		new ServerlessSpy(this, 'ServerlessSpy', {
			generateSpyEventsFileLocation: 'integrationTests/serverlessSpyEvents.ts',
		}).spy();
	}
}
