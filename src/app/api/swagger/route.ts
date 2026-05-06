import { createSwaggerSpec } from "next-swagger-doc";
import { NextResponse } from "next/server";

export const GET = async () => {
  const spec = createSwaggerSpec({
    apiFolder: "src/app/api",
    definition: {
      openapi: "3.0.0",
      info: {
        title: "Open Quizz API",
        version: "1.0",
        description: "API Documentation for Open Quizz application.",
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
      security: [],
    },
  });

  return NextResponse.json(spec);
};
