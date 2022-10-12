import { CfnOutput, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as codecommit from "aws-cdk-lib/aws-codecommit";
import * as codepipeline from "aws-cdk-lib/aws-codepipeline";
import * as codebuild from "aws-cdk-lib/aws-codebuild";
import * as codepipeline_actions from "aws-cdk-lib/aws-codepipeline-actions";

export class PipelineCdkStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    const sourceRepo = new codecommit.Repository(this, "CICD_Workshop", {
      repositoryName: "CICD_Workshop",
      description: "Repository for my application code and infrastructure",
    });

    const pipeline = new codepipeline.Pipeline(this, "CICD_Pipeline", {
      pipelineName: "CICD_Pipeline",
      crossAccountKeys: false,
    });

    const codeQualityBuild = new codebuild.PipelineProject(this, 'Project', {
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_5_0, 
        privileged: true
      },
      buildSpec: codebuild.BuildSpec.fromSourceFilename('buildspec_test.yml')
    });


    const sourceOutput = new codepipeline.Artifact();
    const unitTestOutput = new codepipeline.Artifact();

    pipeline.addStage({
      stageName: "Source",
      actions: [
        new codepipeline_actions.CodeCommitSourceAction({
          actionName: "CodeCommit",
          repository: sourceRepo,
          output: sourceOutput,
          branch: "main",
        }),
      ],
    });

    pipeline.addStage({
      stageName: "Code-Quality-Testing",
      actions: [
        new codepipeline_actions.CodeBuildAction({
          actionName: "Unit-Test",
          project: codeQualityBuild,
          input: sourceOutput,
          outputs: [unitTestOutput],
        }),
      ],
    });

    new CfnOutput(this, "CodeCommitRepositoryUrl", {
      value: sourceRepo.repositoryCloneUrlHttp,
    });
  }
}
