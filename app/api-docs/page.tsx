"use client";

import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen p-4 bg-[var(--background)]">
      <style jsx global>{`
        .swagger-ui {
          --swagger-ui-background: #ffffff;
          --swagger-ui-text: #3b4151;
          --swagger-ui-border: #d0d0d0;
        }
        .swagger-ui .topbar {
          background-color: #89bf04;
        }
        .swagger-ui .info .title {
          color: #3b4151;
        }
        .swagger-ui .scheme-container {
          background: #fafafa;
        }
        .swagger-ui .opblock.opblock-get {
          background: #e7f3ff;
          border-color: #61affe;
        }
        .swagger-ui .opblock.opblock-post {
          background: #e7f6e7;
          border-color: #49cc90;
        }
        .swagger-ui .opblock.opblock-put {
          background: #fff4e6;
          border-color: #fca130;
        }
        .swagger-ui .opblock.opblock-delete {
          background: #ffe7e7;
          border-color: #f93e3e;
        }
        .swagger-ui .opblock.opblock-patch {
          background: #e7f3ff;
          border-color: #50e3c2;
        }
        .swagger-ui .opblock-body pre {
          background: #ffffff;
          color: #3b4151;
        }
        .swagger-ui .response-col_status {
          color: #3b4151;
        }
        .swagger-ui .response-col_links {
          color: #3b4151;
        }
        .swagger-ui .model-box {
          background: #ffffff;
        }
        .swagger-ui .model-title {
          color: #3b4151;
        }
        .swagger-ui .prop-type {
          color: #3b4151;
        }
        .swagger-ui .prop-name {
          color: #3b4151;
        }
        .swagger-ui table thead tr td,
        .swagger-ui table thead tr th {
          background: #fafafa;
          color: #3b4151;
        }
        .swagger-ui .parameter__name {
          color: #3b4151;
        }
        .swagger-ui .parameter__type {
          color: #3b4151;
        }
        .swagger-ui .response-col_description {
          color: #3b4151;
        }
      `}</style>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-4xl font-bold mb-2 text-[var(--foreground)]">
            API Documentation
          </h1>
          <p className="text-gray-600">
            Interactive API documentation - test endpoints directly from your
            browser
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <SwaggerUI
            url="/api/openapi"
            docExpansion="list"
            defaultModelsExpandDepth={1}
            defaultModelExpandDepth={1}
            tryItOutEnabled={true}
            requestInterceptor={(request) => {
              // Ensure requests work with Next.js API routes
              return request;
            }}
          />
        </div>
      </div>
    </div>
  );
}
