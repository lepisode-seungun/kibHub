import { Controller, Get, Post, Patch, Delete, Param, Body, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FaqsService } from './faqs.service';
import { AuthGuard } from '../auth/auth.guard';
import { CreateFaqDto } from '@kibhub/shared';

@ApiTags('faqs')
@Controller('faqs')
export class FaqsController {
  constructor(private faqsService: FaqsService) {}

  @Get()
  findAll(@Query() query: { search?: string; status?: string }) {
    return this.faqsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.faqsService.findOne(id);
  }

  @Post()
  @UseGuards(AuthGuard)
  create(@Body() data: CreateFaqDto) {
    return this.faqsService.create(data);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  update(@Param('id', ParseIntPipe) id: number, @Body() data: Partial<CreateFaqDto>) {
    return this.faqsService.update(id, data);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.faqsService.delete(id);
  }
}
