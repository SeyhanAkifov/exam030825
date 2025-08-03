import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import { BlockPublicAccess, Bucket } from "aws-cdk-lib/aws-s3";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import * as iam from "aws-cdk-lib/aws-iam";
import * as sns from "aws-cdk-lib/aws-sns";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as subs from "aws-cdk-lib/aws-sns-subscriptions";
import * as path from "path";

import { Queue } from "aws-cdk-lib/aws-sqs";
import { Subscription, Topic } from "aws-cdk-lib/aws-sns";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import { Code, Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3n from "aws-cdk-lib/aws-s3-notifications";
import { LambdaIntegration, RestApi } from "aws-cdk-lib/aws-apigateway";
import { table } from "console";

export class ExamStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const senderEmail = 'seyhan_akifov@yahoo.com'; // ← hier später Sisis Adresse eintragen


    //Create DynamoDB table witt delete after 30 minutes
    const dynamoTable = new dynamodb.Table(this, 'Sisi-Table', {
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      timeToLiveAttribute: 'ttl',
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    const topic = new sns.Topic(this, "SisiTopic");

    const sisiSubscription = new Subscription(
      this,
      "SisiSubscription",
      {
        topic: topic,
        protocol: sns.SubscriptionProtocol.EMAIL,
        endpoint: senderEmail,
      }
    );



    const sisiapi = new RestApi(this, "Sisi-Api", {
      restApiName: "Sisi Service",
      description: "This service serves sisi orders.",
    });

    const sisiapiressourse = sisiapi.root.addResource("sisiservices");

    const notifyAfterDeleteFunction = new NodejsFunction(this, 'NotifierFunction', {
      entry: path.join(__dirname, "../src/notifyAfterDelete.ts"),
      handler: "handler",
      runtime: Runtime.NODEJS_20_X,
      environment: {
        DYNAMO_TABLE_NAME: dynamoTable.tableName,
        TOPIC_ARN: topic.topicArn,

      },
    });
    dynamoTable.grantReadWriteData(notifyAfterDeleteFunction);
    topic.grantPublish(notifyAfterDeleteFunction);

    
    const schedulerInvokeRole = new iam.Role(this, 'SchedulerInvokeRole', {
      assumedBy: new iam.ServicePrincipal('scheduler.amazonaws.com'),
    });

    notifyAfterDeleteFunction.grantInvoke(schedulerInvokeRole);



    const sisiApiFunction = new NodejsFunction(this, "PostTableFunction", {
      entry: path.join(__dirname, "../src/postObject.ts"),
      handler: "handler",
      runtime: Runtime.NODEJS_20_X,
      environment: {
        DYNAMO_TABLE_NAME: dynamoTable.tableName,
        TOPIC_ARN: topic.topicArn,
        DELETE_LAMBDA_ARN: notifyAfterDeleteFunction.functionArn,
        SCHEDULER_ROLE: schedulerInvokeRole.roleArn
      },
    });
    sisiApiFunction.grantInvoke(schedulerInvokeRole);
    const sisiapipost = sisiapiressourse.addMethod(
      "POST",
      new LambdaIntegration(sisiApiFunction, { proxy: true })
    );

    schedulerInvokeRole.addToPolicy(new iam.PolicyStatement({
  actions: ['lambda:InvokeFunction'],
  resources: [
    sisiApiFunction.functionArn,
    notifyAfterDeleteFunction.functionArn
  ],
}));
    

    dynamoTable.grantReadWriteData(sisiApiFunction);
    topic.grantPublish(sisiApiFunction);






  }
}
