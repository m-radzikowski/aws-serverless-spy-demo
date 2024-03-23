#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import {ServerlessSpyDemoStack} from '../lib/serverlessSpyDemoStack';

const app = new cdk.App();
new ServerlessSpyDemoStack(app, 'ServerlessSpyDemo');
