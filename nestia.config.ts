import { INestiaConfig } from "@nestia/sdk";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter } from "@nestjs/platform-fastify";
import { AppModule } from "./src/app.module";

export const NESTIA_CONFIG: INestiaConfig = {
  /**
   * Accessor of controller classes.
   *
   * Asynchronous function returning `INestApplication` instance
   */
  input: async () => {
    const app = await NestFactory.create(AppModule, new FastifyAdapter());
    // app.setGlobalPrefix("api");
    return app;
  },

  /**
   * Building `swagger.json` is also possible.
   */
  swagger: {
    /**
     * Output path of the `swagger.json`.
     */
    output: "swagger.json",
    security: {
      bearer: {
        type: "apiKey",
        name: "Authorization",
        in: "header",
      }
    }
  },
};
export default NESTIA_CONFIG;
