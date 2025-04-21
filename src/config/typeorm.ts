// import { registerAs } from '@nestjs/config';
// import { DataSource, DataSourceOptions } from 'typeorm';
// import { databaseConfig } from './database.config';

// const config = {
//   type: 'mariadb',
//   host: `${databaseConfig.host}`,
//   port: `${databaseConfig.port}`,
//   username: `${databaseConfig.username}`,
//   password: `${databaseConfig.password}`,
//   database: `${databaseConfig.database}`,
//   entities: ['dist/**/*.entity{.ts,.js}'],
//   migrations: ['dist/migrations/*{.ts,.js}'],
//   autoLoadEntities: true,
//   synchronize: false,
// };

// export default registerAs('typeorm', () => config);
// export const connectionSource = new DataSource(config as DataSourceOptions);
