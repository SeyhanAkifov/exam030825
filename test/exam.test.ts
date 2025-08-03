import * as cdk from 'aws-cdk-lib';
import { ExamStack } from '../lib/exam-stack'; // Pfad zu deinem Stack

test('Snapshot test for ExamStack', () => {
  const app = new cdk.App();
  const stack = new ExamStack(app, 'ExamStack');

  // Template in JSON holen
  const template = cdk.assertions.Template.fromStack(stack);

  // Snapshot speichern (Template JSON)
  expect(template.toJSON()).toMatchSnapshot();
});