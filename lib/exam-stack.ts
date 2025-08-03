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

    

    const table = new dynamodb.Table(this, 'JsonEventsTable', {
      partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.NUMBER },
      timeToLiveAttribute: 'ttl',
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });





    
  }
}
