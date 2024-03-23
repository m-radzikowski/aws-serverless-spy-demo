import {createServerlessSpyListener, ServerlessSpyListener} from "serverless-spy";
import * as cdkOutput from '../cdkOutputs.json';
import {EventBridgeClient, PutEventsCommand} from "@aws-sdk/client-eventbridge";
import {DynamoDBItem, EventDetail} from "../lambda/types";
import {ServerlessSpyEvents} from "./serverlessSpyEvents";

const eventBridge = new EventBridgeClient();

let serverlessSpy: ServerlessSpyListener<ServerlessSpyEvents>;

beforeEach(async () => {
	serverlessSpy = await createServerlessSpyListener<ServerlessSpyEvents>({
		serverlessSpyWsUrl: cdkOutput.ServerlessSpyDemo.ServerlessSpyWsUrl,
	});
});

afterEach(async () => {
	serverlessSpy.stop();
});

test('EventBridge to Lambda to DynamoDB and EventBridge', async () => {
	const id = new Date().toISOString();
	const message = `Integration Test ${id}`;

	console.log(`Test ID: ${id}`);

	await eventBridge.send(new PutEventsCommand({
		Entries: [
			{
				EventBusName: cdkOutput.ServerlessSpyDemo.CustomEventBusName,
				Source: "ServerlessSpyDemo",
				DetailType: "EventA",
				Detail: JSON.stringify({id, message} satisfies EventDetail),
			},
		],
	}));

	(await serverlessSpy.waitForEventBridgeRuleCustomEventBusInvokeProcessingLambda<EventDetail>({
		condition: event => event.detail.id === id,
	}));

	(await serverlessSpy.waitForDynamoDBDataTable<DynamoDBItem>({
		condition: (item) => item.keys.pk === "shard1" && item.keys.sk === id,
	})).toMatchObject({
		eventName: 'INSERT',
		newImage: {
			pk: "shard1",
			sk: id,
			message: message,
		},
	});

	(await serverlessSpy.waitForEventBridgeCustomEventBus<EventDetail>({
		condition: event => event.detailType === "EventB" && event.detail.id === id,
	})).toMatchObject({
		detail: {
			id,
			message: "Response from Lambda A",
		},
	});
});
