
const AWS = require('aws-sdk');
AWS.config.update({
    region: "ap-northeast-2"
});
const chromium = require('chrome-aws-lambda');



exports.handler = async (event, context) => {
    console.log(event);
    console.log(event["CodePipeline.job"].data.actionConfiguration.configuration);
    var codepipeline = new AWS.CodePipeline();
    var jobId = event["CodePipeline.job"].id;
    const UserParameters = event["CodePipeline.job"].data.actionConfiguration.configuration.UserParameters.split(",");
    let browser = null;
    try {
        browser = await chromium.puppeteer.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath,
            headless: chromium.headless,
            ignoreHTTPSErrors: true,
        });
        console.log("page url:", UserParameters[0])
        let page = await browser.newPage();
        await page.goto(`${UserParameters[0]}`);



        //"환영합니다." 가 있다면,
        let find = await page.$x(`//p[contains(., '환영합니다.')]`);
        if (find.length < 1) {
            var failedParm = {
                jobId: jobId,
                failureDetails: {
                    message: "환영합니다를 찾지 못했습니다.",
                    type: 'JobFailed',
                    externalExecutionId: context.awsRequestId
                }
            };
            await codepipeline.putJobFailureResult(failedParm).promise();
        }
        else {
            await codepipeline.putJobSuccessResult({ jobId: jobId }).promise();
        }

    } catch (error) {
        console.log(error);
        console.log(e);
        var failedParm = {
            jobId: jobId,
            failureDetails: {
                message: JSON.stringify(e.message),
                type: 'JobFailed',
                externalExecutionId: context.awsRequestId
            }
        };
        await codepipeline.putJobFailureResult(failedParm).promise();
    } finally {
        if (browser !== null) {
            let pages = await browser.pages()
            await Promise.all(pages.map(page => page.close()))
            await browser.close();
        }
    }
}