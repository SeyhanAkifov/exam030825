import {
    DynamoDBClient,
    PutItemCommand,
    ReturnConsumedCapacity,
} from "@aws-sdk/client-dynamodb";
import { PublishCommand, SNSClient } from "@aws-sdk/client-sns";
import { APIGatewayProxyEvent } from "aws-lambda";
import { v4 as uuidv4 } from 'uuid';
import { CreateScheduleCommand, SchedulerClient } from "@aws-sdk/client-scheduler";
import { off } from "process";


const ddb = new DynamoDBClient();
const snsClient = new SNSClient({});
const schedulerClient = new SchedulerClient();


export const handler = async (event: APIGatewayProxyEvent) => {
    console.log(JSON.stringify(event));



    const TABLE_NAME = process.env.DYNAMO_TABLE_NAME;
    const TOPIC_ARN = process.env.TOPIC_ARN!;
const DELETE_LAMBDA_ARN = process.env.DELETE_LAMBDA_ARN!;
 const SCHEDULER_ROLE = process.env.SCHEDULER_ROLE;

    const now = Math.floor(Date.now() / 1000);
    const ttl = now + 24 * 60 * 60;
    const body = JSON.parse(event.body || '{}');
    const { valid, value, description, buyer } = JSON.parse(event.body || '{}');
    const timestamp = Math.floor(Date.now() / 1000);
    const itemUID = uuidv4();

 let currentDate = new Date(now);
    console.log("Current Date: " + currentDate);

    // Get the current minutes of the date
    let currentMinutes = currentDate.getMinutes();

    // Add 30 minutes
    let newDate = currentDate.setMinutes(currentMinutes + 30);

    if (valid) {
        await snsClient.send(new PublishCommand({
            TopicArn: TOPIC_ARN,
            Subject: 'Valid JSON received',
            Message: JSON.stringify(body),
        }));
        return { statusCode: 200, body: 'Valid JSON sent via email.' };
    } else {
        await ddb.send(new PutItemCommand({
            TableName: TABLE_NAME,
            Item: {
                PK: {
                    S: `ITEM#${itemUID.toString()}`
                },
                SK: {
                    S: `METADATA#${itemUID.toString()}`
                },
                createdAt:
                {
                    N: timestamp.toString(),
                },
                ttl: {
                    N: ttl.toString()
                },
                body: {
                    S: JSON.stringify(body)
                },
                valid: {
                    BOOL: valid
                },
                value: {
                    N: value.toString()
                },
                description: {
                    S: description
                },
                buyer: {
                    S: buyer
                }
            }
        }));

        await schedulerClient.send(new CreateScheduleCommand({
        Name: "30MinDeleteScheduler",
        ScheduleExpression: `at(${newDate})`,
        Target: {
            Arn: DELETE_LAMBDA_ARN,
            Input: JSON.stringify({ itemUID, now }),
            RoleArn: SCHEDULER_ROLE
        },
        FlexibleTimeWindow: {
            Mode: "OFF"
        }
    }));

        return { statusCode: 400, body: 'Invalid JSON logged to DynamoDB.' };
    }



   

    

};