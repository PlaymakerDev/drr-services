import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { MasterModule } from './master/master.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { TblComplaintsModule } from './tbl_complaints/complaints.module';
import { ReportModule } from './report/report.module';
import { DepartmentModule } from './department/department.module';
import { UserModule } from './user/user.module';
import { TblmasterModule } from './tblmaster/tblmaster.module';
import { TblpositionModule } from './tblposition/tblposition.module';
import { PrefixModule } from './prefix/prefix.module';
import { RoleModule } from './role/role.module';
import { join } from 'path';
import { JwtMiddleware } from './guards/jwt-auth.guard';
import { JwtService } from '@nestjs/jwt';
import { ReportCertifierModule } from './report_certifier/report_certifier.module';

@Module({
  imports: [
    DatabaseModule,
    MasterModule,
    DashboardModule,
    TblComplaintsModule,
    ReportModule,
    DepartmentModule,
    UserModule,
    TblmasterModule,
    TblpositionModule,
    PrefixModule,
    RoleModule,
    ReportCertifierModule,
  ],
  controllers: [AppController],
  providers: [AppService, JwtService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(JwtMiddleware)
      .exclude(
        "/user/signup",
        "/source_type/image/(.*)",
        "/user/login",
        // "/report/view_director", // OHM Comment
        
        // "/report/view_monthly_summary",
        // "/report/receive_complaint",
        // { path: `${process.env.REPORT_SERVER}/api/v1/report/export_monthly_summary?year_month=`, method: RequestMethod.ALL},
        { path: 'complaints/get_file/(.*)', method: RequestMethod.ALL},
        { path: '/report/export_monthly_summary', method: RequestMethod.ALL},
        // { path: '/report/export', method: RequestMethod.ALL},
        // { path: '/report/view_director', method: RequestMethod.ALL}, // OHM Comment
        // { path: '/report/view_monthly_summary', method: RequestMethod.ALL},
        // { path: '/report/receive_complaint', method: RequestMethod.ALL},
        { path: 'complaints/fix_upload/(.*)', method: RequestMethod.ALL},
        // { path: 'report/(.*)', method: RequestMethod.ALL},

      )
      .forRoutes("*");
  }
}
