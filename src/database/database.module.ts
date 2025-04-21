import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { SequelizeModule } from "@nestjs/sequelize";
import { truncate } from "lodash";
import sequelize from "sequelize";
import { Models } from "src/models";

@Module({
  imports: [
    ConfigModule.forRoot(),
    SequelizeModule.forRoot({
      dialect: 'mysql',
      host: process.env.DATABASE_HOST,
      port: Number(process.env.DATABASE_PORT),
      username: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      synchronize: Boolean(Number(process.env.DATABASE_SYNCHRONIZE)) || false,
      timezone: "+07:00",
      autoLoadModels: true,
      models: [...Models],
      logging: true, //|| process.env.NODE_ENV !== "production",,
      logQueryParameters: true, //|| process.env.NODE_ENV !== "production",
    }),
    sequelize.AsyncQueueError,
  ],
})
export class DatabaseModule {}
