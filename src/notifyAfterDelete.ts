import {
    DynamoDBClient,
    DeleteItemCommand
} from "@aws-sdk/client-dynamodb";
import { PublishCommand, SNSClient } from "@aws-sdk/client-sns";
import { EventBridgeEvent } from "aws-lambda";


const ddb = new DynamoDBClient();
const snsClient = new SNSClient({});

const TABLE_NAME = process.env.TABLE_NAME!;
const TOPIC_ARN = process.env.TOPIC_ARN!;


export const handler = async (event: EventBridgeEvent<string, string>) => {

   const detail = JSON.parse(event.detail); // 💡 korrekt parsen

  const { itemUID, createdAt } = detail;

    const result = await ddb.send(new DeleteItemCommand({
        TableName: TABLE_NAME,
        Key: {
            PK: {
                S: `ITEM#${itemUID.toString()}`
            },
            SK: {
                S: `METADATA#${itemUID.toString()}`
            },
        }
    }));


    


const now = Math.floor(Date.now() / 1000);;
const milliDiff: number = now - createdAt;

const totalSeconds = Math.floor(milliDiff / 1000);

const totalMinutes = Math.floor(totalSeconds / 60);

    await snsClient.send(new PublishCommand({
        TopicArn: TOPIC_ARN,
        Subject: 'Delete after 30 Minutes',
        Message:  `Object with UUID: ${itemUID.toString()} deleted after ${totalMinutes} minutes.`,
    }));
};