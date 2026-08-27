import { Inject, Controller, Get, Post, Patch, Delete, Param, Body, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PortfoliosService } from './portfolios.service';
import { AuthGuard } from '../auth/auth.guard';
import { CreatePortfolioDto } from '@kibhub/shared';

@ApiTags('portfolios')
@Controller('portfolios')
export class PortfoliosController {
  constructor(@Inject(PortfoliosService) private portfoliosService: PortfoliosService) {}

  @Get()
  findAll(@Query() query: { search?: string; isHallOfFame?: string; page?: string; limit?: string }) {
    const isHallOfFame = query.isHallOfFame === 'true' ? true : query.isHallOfFame === 'false' ? false : undefined;
    return this.portfoliosService.findAll({ search: query.search, isHallOfFame });
  }

  @Get('hall-of-fame')
  findHallOfFame(@Query() query: { search?: string }) {
    return this.portfoliosService.findAll({ search: query.search, isHallOfFame: true });
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.portfoliosService.findOne(id);
  }

  @Post()
  @UseGuards(AuthGuard)
  create(@Body() data: CreatePortfolioDto) {
    return this.portfoliosService.create(data);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  update(@Param('id', ParseIntPipe) id: number, @Body() data: Partial<CreatePortfolioDto>) {
    return this.portfoliosService.update(id, data);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.portfoliosService.delete(id);
  }
}
