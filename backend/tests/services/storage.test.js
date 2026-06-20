import { describe, test, expect, vi, beforeEach } from 'vitest';

const mockMinioClientInstance = {
  bucketExists: vi.fn(),
  makeBucket: vi.fn(),
  putObject: vi.fn(),
  presignedGetObject: vi.fn()
};

function MockMinioClient() {
  return mockMinioClientInstance;
}
MockMinioClient.default = MockMinioClient;

const minioPath = require.resolve('minio');
require.cache[minioPath] = {
  id: minioPath,
  filename: minioPath,
  loaded: true,
  exports: {
    Client: MockMinioClient
  }
};

const storageService = require('../../src/services/storage.service.js');

describe('storage.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('ensureBucket should create bucket if it does not exist', async () => {
    mockMinioClientInstance.bucketExists.mockResolvedValue(false);
    mockMinioClientInstance.makeBucket.mockResolvedValue(true);

    await storageService.ensureBucket('test-bucket');

    expect(mockMinioClientInstance.bucketExists).toHaveBeenCalledWith('test-bucket');
    expect(mockMinioClientInstance.makeBucket).toHaveBeenCalledWith('test-bucket');
  });

  test('ensureBucket should not create bucket if it already exists', async () => {
    mockMinioClientInstance.bucketExists.mockResolvedValue(true);

    await storageService.ensureBucket('test-bucket');

    expect(mockMinioClientInstance.bucketExists).toHaveBeenCalledWith('test-bucket');
    expect(mockMinioClientInstance.makeBucket).not.toHaveBeenCalled();
  });

  test('uploadFile should ensure bucket and put object', async () => {
    mockMinioClientInstance.bucketExists.mockResolvedValue(true);
    mockMinioClientInstance.putObject.mockResolvedValue({});

    const buffer = Buffer.from('test-content');
    await storageService.uploadFile('test-bucket', 'test-key', buffer, 'text/plain');

    expect(mockMinioClientInstance.bucketExists).toHaveBeenCalledWith('test-bucket');
    expect(mockMinioClientInstance.putObject).toHaveBeenCalledWith(
      'test-bucket',
      'test-key',
      buffer,
      buffer.length,
      { 'Content-Type': 'text/plain' }
    );
  });

  test('getPresignedUrl should call presignedGetObject', async () => {
    mockMinioClientInstance.presignedGetObject.mockResolvedValue('http://mock-url/file');

    const url = await storageService.getPresignedUrl('test-bucket', 'test-key');

    expect(url).toBe('http://mock-url/file');
    expect(mockMinioClientInstance.presignedGetObject).toHaveBeenCalledWith('test-bucket', 'test-key', 900);
  });

  test('saveGeneratedServerCode should upload generated code to servers bucket', async () => {
    mockMinioClientInstance.bucketExists.mockResolvedValue(true);
    mockMinioClientInstance.putObject.mockResolvedValue({});

    const key = await storageService.saveGeneratedServerCode('serv1', 'console.log("hello");');

    expect(key).toBe('serv1/server.ts');
    expect(mockMinioClientInstance.putObject).toHaveBeenCalledWith(
      'servers',
      'serv1/server.ts',
      expect.any(Buffer),
      expect.any(Number),
      { 'Content-Type': 'application/typescript' }
    );
  });
});
