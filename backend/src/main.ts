import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { GlobalExceptionFilter } from "./common/filters/global-exception.filter";
import { TenantMiddleware } from "./common/middleware/tenant.middleware";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: process.env.NODE_ENV === "production" ? ["error", "warn"] : ["log", "error", "warn", "debug", "verbose"],
  });

  const apiPrefix = process.env.API_PREFIX || "/api/v1";
  app.setGlobalPrefix(apiPrefix);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      disableErrorMessages: process.env.NODE_ENV === "production",
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Tenant isolation middleware
  app.use(new TenantMiddleware().use.bind(new TenantMiddleware()));

  // CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
  });

  // Swagger
  if (process.env.SWAGGER_ENABLED === "true") {
    const config = new DocumentBuilder()
      .setTitle("PeopleHub HRM API")
      .setDescription("PeopleHub Human Resource Management System API")
      .setVersion("0.1.0")
      .addBearerAuth(
        { type: "http", scheme: "bearer", bearerFormat: "JWT" },
        "access-token",
      )
      .addTag("auth", "Authentication endpoints")
      .addTag("users", "User management")
      .addTag("employees", "Employee management")
      .addTag("departments", "Department management")
      .addTag("positions", "Position management")
      .addTag("health", "Health checks")
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup(process.env.SWAGGER_PATH || "docs", app, document);
  }

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`PeopleHub backend listening on http://localhost:${port}`);
  console.log(`Swagger UI: http://localhost:${port}/${process.env.SWAGGER_PATH || "docs"}`);
}

bootstrap();
