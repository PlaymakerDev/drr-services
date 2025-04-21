import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import * as timezone from 'dayjs/plugin/timezone';
import { RolesGuard } from 'src/guards/role.guard';
import { Role } from 'src/guards/roles.decorator';

dayjs.extend(utc);
dayjs.extend(timezone);

@UseGuards(RolesGuard)
@ApiTags('Dashboard')
@Controller({
  version: '1',
  path: 'dashboard',
})
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @ApiQuery({
    required: false,
    description: "For date search, 2024-01-31 etc.",
    name: "dateSearch",
  })
  @Role(1, 2)
  @ApiBearerAuth()
  @Get("top3_complain")
  async top3Complain(@Query("dateSearch") dateSearch: string,) {
    const data = await this.dashboardService.getTop3Complain(dateSearch);

    const series = data.map(item => item.source_type_count);
    const labels = data.map(item => item.source_name);

    const result = {
      graph: { series, labels },
      data: data
    };
    return result;
  }

  @ApiQuery({
    required: false,
    description: "For date search, 2024-01-31 etc.",
    name: "dateSearch",
  })
  @Role(1, 2)
  @ApiBearerAuth()
  @Get("top3_progress")
  async top3Progress(@Query("dateSearch") dateSearch: string,) {
    const data = await this.dashboardService.getTop3Progress(dateSearch);
    return data;
  }

  @ApiQuery({
    required: false,
    description: "For date search, 2024-01-31 etc.",
    name: "dateSearch",
  })
  @Role(1, 2)
  @ApiBearerAuth()
  @Get("most_popular")
  async mostPopular(@Query("dateSearch") dateSearch: string,) {
    const data = await this.dashboardService.getMostPopular(dateSearch);
    return data;
  }

  @ApiQuery({
    required: false,
    description: "For date search, 2024-01-31 etc.",
    name: "dateSearch",
  })
  @Role(1, 2)
  @ApiBearerAuth()
  @Get("compare_process_close")
  async compareProcessClose(@Query("dateSearch") dateSearch: string,) {
    const data = await this.dashboardService.getCompareProcessClose(dateSearch);
    return data;
  }

  @ApiQuery({
    required: false,
    description: "For date search, 2024-01-31 etc.",
    name: "dateSearch",
  })
  @Role(1, 2)
  @ApiBearerAuth()
  @Get("compare_process_close_2years")
  async compareProcessClose2Years(@Query("dateSearch") dateSearch: string,) {
    const data = await this.dashboardService.getCompareProcessClose2Years(dateSearch);
    return data;
  }

  @ApiQuery({
    required: false,
    description: "For date search, 2024-01-31 etc.",
    name: "dateSearch",
  })
  @Role(1, 2)
  @ApiBearerAuth()
  @Get("count_complaints")
  async countComplaints(@Query("dateSearch") dateSearch: string,) {
    const data = await this.dashboardService.getCountComplaints(dateSearch);
    return data;
  }

  @ApiQuery({
    required: false,
    description: "For date search, 2024-01-31 etc.",
    name: "dateSearch",
  })
  @Role(1, 2)
  @ApiBearerAuth()
  @Get("count_complain_type")
  async countComplainType(@Query("dateSearch") dateSearch: string,) {
    const data = await this.dashboardService.getCountComplainType(dateSearch);
    return data;
  }

  @ApiQuery({
    required: false,
    description: "For date search, 2024-01-31 etc.",
    name: "dateSearch",
  })
  @Role(1, 2)
  @ApiBearerAuth()
  @Get("top3_department_complain")
  async top3DepartmentComplain(@Query("dateSearch") dateSearch: string,) {
    const data = await this.dashboardService.getTop3DepartmentComplain(dateSearch);
    return data;
  }

  @ApiQuery({
    required: false,
    description: "For date search, 2024-01-31 etc.",
    name: "dateSearch",
  })
  @Role(1, 2)
  @ApiBearerAuth()
  @Get("latest_complain")
  async latestComplain(@Query("dateSearch") dateSearch: string,) {
    const limit_data = 3;
    const data = await this.dashboardService.getLatestComplain(dateSearch, limit_data);
    return data;
  }

  @ApiQuery({
    required: false,
    description: "For date search, 2024-01-31 etc.",
    name: "dateSearch",
  })
  @Role(1, 2)
  @ApiBearerAuth()
  @Get("all_latest_complain")
  async allLatestComplain(@Query("dateSearch") dateSearch: string) {
    const data = await this.dashboardService.getLatestComplain(dateSearch);
    return data;
  }

  @ApiQuery({
    required: true,
    description: "For end date search, 2024-03-31 etc.",
    name: "endDateSearch",
  })
  @ApiQuery({
    required: true,
    description: "For start date search, 2024-01-01 etc.",
    name: "startDateSearch",
  })
  @Role(1, 2)
  @ApiBearerAuth()
  @Get("all_complain")
  async allComplain(@Query("startDateSearch") startDateSearch: string, @Query("endDateSearch") endDateSearch: string,) {
    const data = await this.dashboardService.getAllComplains(startDateSearch, endDateSearch);
    return data;
  }

  @ApiQuery({
    required: false,
    description: "For date search, 2024-01-31 etc.",
    name: "dateSearch",
  })
  @Role(1, 2)
  @ApiBearerAuth()
  @Get("today_all_source")
  async todayAllSource(@Query("dateSearch") dateSearch: string,) {
    if (!dateSearch) {
      dateSearch = new Date().toISOString().substring(0, 10);
    }
    const data = await this.dashboardService.getAllComplains(dateSearch, dateSearch);
    return data;
  }

  @ApiQuery({
    required: true,
    description: "For category type, [1 = complain, 2 = service]",
    name: "category_type",
  })
  @ApiQuery({
    required: true,
    description: "For end date search, 2024-03-31 etc.",
    name: "endDateSearch",
  })
  @ApiQuery({
    required: true,
    description: "For start date search, 2024-01-01 etc.",
    name: "startDateSearch",
  })
  @Role(1, 2)
  @ApiBearerAuth()
  @Get("compare_process_close_of_complain")
  async compareProcessCloseOfComplain(@Query("startDateSearch") startDateSearch: string, @Query("endDateSearch") endDateSearch: string, @Query("category_type") category_type: string) {
    const data = await this.dashboardService.getCompareProcessCloseOfComplain(category_type, startDateSearch, endDateSearch);
    return data;
  }

  @ApiQuery({
    required: true,
    description: "For end date search, 2024-03-31 etc.",
    name: "endDateSearch",
  })
  @ApiQuery({
    required: true,
    description: "For start date search, 2024-01-01 etc.",
    name: "startDateSearch",
  })
  @Role(1, 2)
  @ApiBearerAuth()
  @Get("progress_by_date_range")
  async progressByDateRange(@Query("startDateSearch") startDateSearch: string, @Query("endDateSearch") endDateSearch: string) {
    const data = await this.dashboardService.getProgressByDateRange(startDateSearch, endDateSearch);
    return data;
  }

  @ApiQuery({
    required: false,
    description: "For date search, 2024-01-31 etc.",
    name: "dateSearch",
  })
  @Role(1, 2)
  @ApiBearerAuth()
  @Get("progress_full_year")
  async progressFullYear(@Query("dateSearch") dateSearch: string,) {
    let current_date = new Date();
    if (dateSearch) {
      current_date = new Date(Date.parse(dateSearch));
    }

    const first_day = new Date(current_date.getFullYear(), 0, 1);
    first_day.setDate(first_day.getDate() + 1);
    const last_day = new Date(current_date.getFullYear(), 11, 31);
    last_day.setDate(last_day.getDate() + 1);

    const first_date = first_day.toISOString().substring(0, 10);
    const last_date = last_day.toISOString().substring(0, 10);

    const data = await this.dashboardService.getProgressByDateRange(first_date, last_date);
    return data;
  }

  @ApiQuery({
    required: true,
    description: "For end date search, 2024-03-31 etc.",
    name: "endDateSearch",
  })
  @ApiQuery({
    required: true,
    description: "For start date search, 2024-01-01 etc.",
    name: "startDateSearch",
  })
  @ApiQuery({
    required: true,
    description: "For deptType search, [1=สำนัก, 2=แขวง].",
    name: "deptType",
  })
  @Role(1, 2)
  @ApiBearerAuth()
  @Get("department_complain")
  async departmentComplain(@Query("deptType") deptType: string, @Query("startDateSearch") startDateSearch: string, @Query("endDateSearch") endDateSearch: string) {
    const data = await this.dashboardService.getDepartmentComplain(deptType, startDateSearch, endDateSearch);
    return data;
  }

  @ApiQuery({
    required: false,
    description: "For date search, 2024-01-31 etc.",
    name: "dateSearch",
  })
  @Role(1, 2)
  @ApiBearerAuth()
  @Get("today_department_complain")
  async todayDepartmentComplain(@Query("dateSearch") dateSearch: string,) {
    if (!dateSearch) {
      dateSearch = new Date().toISOString().substring(0, 10);
    }
    dayjs(dateSearch).tz('Asia/Bangkok').format('YYYY-MM');
    const data = await this.dashboardService.getDepartmentComplaintoday([1, 2], dateSearch, dateSearch);
    return data;
  }
}
