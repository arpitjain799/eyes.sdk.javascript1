package com.applitools.eyes.utils;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.ArrayList;
import java.util.List;

public class TestResultReportSummary {

    @JsonProperty("group")
    private String group;

    @JsonProperty("id")
    private String id = null;

    @JsonProperty("sdk")
    private String sdk = "java";

    @JsonProperty("sdk")
    public String getSdkName() {
        return sdk;
    }

    @JsonProperty("sdk")
    public void setSdkName(String sdk) { this.sdk = sdk; }

    @JsonProperty("id")
    public String getId() {
        if (this.id == null) {
            this.id = System.getenv("APPLITOOLS_REPORT_ID");
        }
        if (this.id == null) {
            return "0000-0000";
        }
        return this.id;
    }

    @JsonProperty("id")
    public void setId(String id) {
        this.id = id;
    }

    @JsonProperty("sandbox")
    public boolean getSandbox() {
        String isSandbox = System.getenv("APPLITOOLS_REPORT_TO_SANDBOX");
        return !"false".equalsIgnoreCase(isSandbox);
    }

    @JsonProperty("group")
    public String getGroup() {
        return this.group;
    }

    @JsonProperty("group")
    public void setGroup(String group) {
        this.group = group;
    }

    @JsonProperty("results")
    private final List<TestResult> testResults = new ArrayList<>();

    @JsonProperty("results")
    public List<TestResult> getTestResults() {
        return testResults;
    }

    public boolean addResult(TestResult result) {
        boolean newResult = !testResults.contains(result);
        testResults.add(result);
        return newResult;
    }

    @Override
    public String toString() {
        return String.format("Group: %s ; Result count: %s ; Sandbox: %b", group, testResults.size(), getSandbox());
    }
}
