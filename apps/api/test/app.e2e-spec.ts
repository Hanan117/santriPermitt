import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppController } from './../src/app.controller.js';
import { AppService } from './../src/app.service.js';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  beforeEach(async () => {
    const mod = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();
    app = mod.createNestApplication();
    await app.init();
  });
  it('/ (GET)', () => request(app.getHttpServer()).get('/').expect(200).expect('Hello World!'));
  afterEach(async () => { await app.close(); });
});
