package com.applitools.connectivity.api;

import com.applitools.eyes.Logger;
import com.applitools.utils.ArgumentGuard;

import javax.ws.rs.client.Entity;
import javax.ws.rs.client.Invocation;
import javax.ws.rs.client.InvocationCallback;
import javax.ws.rs.core.Response;
import java.util.concurrent.Future;

public class AsyncRequestImpl extends AsyncRequest {

    Invocation.Builder request;

    AsyncRequestImpl(Invocation.Builder request, Logger logger) {
        super(logger);
        this.request = request;
    }

    @Override
    public AsyncRequest header(String name, String value) {
        ArgumentGuard.notNullOrEmpty(name, "header name");
        request = request.header(name, value);
        return this;
    }

    @Override
    public Future<?> method(String method, final AsyncRequestCallback callback, Object data, String contentType, final boolean logIfError) {
        ArgumentGuard.notNullOrEmpty(method, "method");

        InvocationCallback<Response> invocationCallback = new InvocationCallback<Response>() {
            @Override
            public void completed(Response response) {
                try {
                    callback.onComplete(new ResponseImpl(response, logIfError ? logger : new Logger()));
                } catch (Exception e) {
                    callback.onFail(e);
                }
            }

            @Override
            public void failed(Throwable throwable) {
                callback.onFail(throwable);
            }
        };

        if (data == null || contentType == null) {
            return request.async().method(method, invocationCallback);
        }

        return request.async().method(method, Entity.entity(data, contentType), invocationCallback);
    }
}
