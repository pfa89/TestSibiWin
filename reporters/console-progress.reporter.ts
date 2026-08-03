import type { Reporter, FullConfig, Suite, TestCase, TestResult } from "@playwright/test/reporter";

export default class ConsoleProgressReporter implements Reporter {
  private totalTests = 0;
  private completedTests = 0;

  onBegin(config: FullConfig, suite: Suite) {
    this.totalTests = suite.allTests().length;
    console.log(`\n==================================================`);
    console.log(`[PROGRESS] Starting execution for ${this.totalTests} total test(s) on this shard.`);
    console.log(`==================================================\n`);
  }

  onTestEnd(test: TestCase, result: TestResult) {
    this.completedTests++;
    const remaining = this.totalTests - this.completedTests;
    const status = result.status.toUpperCase();
    console.log(
      `[PROGRESS] Executed: ${this.completedTests}/${this.totalTests} | Remaining: ${remaining} | Status: ${status} | Test: ${test.title}`
    );
  }
}