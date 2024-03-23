export interface EventDetail {
	id: string;
	message: string;
}

export interface DynamoDBItem {
	pk: "shard1",
	sk: string;
	message: string,
}
