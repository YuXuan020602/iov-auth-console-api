import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './modules/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { SOPModule } from './modules/sop/sop.module';
import { KnowledgeModule } from './modules/knowledge/knowledge.module';
import { ForumModule } from './modules/forum/forum.module';
import { SyncModule } from './modules/sync/sync.module';
import { TagsModule } from './modules/tags/tags.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    ProjectsModule,
    SOPModule,
    KnowledgeModule,
    ForumModule,
    SyncModule,
    TagsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
