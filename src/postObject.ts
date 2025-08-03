import {
    DynamoDBClient,
    PutItemCommand,
    ReturnConsumedCapacity,
} from "@aws-sdk/client-dynamodb";
import { PublishCommand, SNSClient } from "@aws-sdk/client-sns";
import { APIGatewayProxyEvent } from "aws-lambda";
import { v4 as uuidv4 } from 'uuid';

const ddb = new DynamoDBClient();

export const handler = async (event: APIGatewayProxyEvent) => {
    console.log(JSON.stringify(event));
   
    
    
const TABLE_NAME = process.env.TABLE_NAME!;
const TOPIC_ARN = process.env.TOPIC_ARN!;

    const snsClient = new SNSClient({});

    const body =  JSON.parse(event.body || '{}');
    const { valid, value, description, buyer } = JSON.parse(event.body || '{}');
    const timestamp = Math.floor(Date.now() / 1000);
    const itemUID = uuidv4();

    if (valid) {
        await snsClient.send(new PublishCommand({
        TopicArn: TOPIC_ARN,
        Subject: 'Valid JSON received',
        Message: JSON.stringify(body, null, 2),
      }));
        return { statusCode: 200, body: 'Valid JSON sent via email.' };
    } else {
        await ddb.send(new PutItemCommand({
            TableName: TABLE_NAME,
            Item: {
                PK: {
                    S: `ITEM#${itemUID}`
                },
                SK: {
                    S: `METADATA#${itemUID}`
                },
                createdAt:
                {
                    N: timestamp.toString(),
                },
                ttl: {
                    N: timestamp.toString() + 24 * 3600
                },
                valid: {
                    B: valid
                },
                value: {
                    N: value
                },
                description: {
                    S: description
                },
                buyer: {
                    S: buyer
                }
            }
        }));
        return { statusCode: 400, body: 'Invalid JSON logged to DynamoDB.' };
    }


    

};