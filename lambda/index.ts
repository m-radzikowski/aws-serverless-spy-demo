import {EventBridgeClient, PutEventsCommand} from "@aws-sdk/client-eventbridge";
import {EventBridgeHandler} from "aws-lambda";
import {DynamoDBClient} from "@aws-sdk/client-dynamodb";
import {DynamoDBDocumentClient, PutCommand} from "@aws-sdk/lib-dynamodb";
import {DynamoDBItem, EventDetail} from "./types";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient());
const eventBridge = new EventBridgeClient();

export const handler: EventBridgeHandler<string, EventDetail, void> = async (event) => {
	console.log('Received event:', JSON.stringify(event, null, 2));

	await ddb.send(new PutCommand({
		TableName: process.env.TABLE_NAME,
		Item: {
			pk: "shard1",
			sk: event.detail.id,
			message: event.detail.message,
		} satisfies DynamoDBItem,
	}));

	await eventBridge.send(new PutEventsCommand({
		Entries: [
			{
				EventBusName: process.env.EVENT_BUS_NAME,
				Source: "ServerlessSpyDemo",
				DetailType: "EventB",
				Detail: JSON.stringify({id: event.detail.id, message: "Response from Lambda A"} satisfies EventDetail),
			},
		],
	}));
}
