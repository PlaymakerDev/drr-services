import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as passport from 'passport';
import * as exphbs from 'express-handlebars';
import { hlp, ifEquals, thiaNumber, toThaiWord } from './hbs/helpers';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: true,
  });
  app.use(passport.initialize());
  app.setGlobalPrefix('api/v1');
  const config = new DocumentBuilder()
    .setTitle('DRR Complaint Service')
    .setDescription('DRR Complaint Service API documents')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  app.useStaticAssets(join(__dirname, '..', 'public'), {
    prefix: '/public/',
  });
  app.setBaseViewsDir(join(__dirname, '..', 'views'));

  const hbs = exphbs.create({
    extname: 'hbs',
    defaultLayout: 'layout_main',
    layoutsDir: join(__dirname, '..', 'views', 'layouts'),
    // partialsDir: join(__dirname, '..', 'views', 'partials'),
    helpers: { hlp, ifEquals, thiaNumber, toThaiWord },
  });

  app.engine('hbs', hbs.engine);
  app.setViewEngine('hbs');

  await app.listen(8003);
}
bootstrap();
