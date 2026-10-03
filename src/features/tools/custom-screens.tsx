import type { ComponentType } from 'react';
import { lazy } from 'react';
import { HashScreen } from '@/features/tools/hash-generator/HashScreen';
import { CaseScreen } from '@/features/tools/case-converter/CaseScreen';
import { WordScreen } from '@/features/tools/word-counter/WordScreen';
import { JwtScreen } from '@/features/tools/jwt-decoder/JwtScreen';
import { UuidScreen } from '@/features/tools/uuid-generator/UuidScreen';
import { CronScreen } from '@/features/tools/cron-parser/CronScreen';
import { DiffScreen } from '@/features/tools/diff-tool/DiffScreen';
import { RegexScreen } from '@/features/tools/regex-tester/RegexScreen';
import { JsonSchemaScreen } from '@/features/tools/json-validator/JsonSchemaScreen';
import { XmlScreen } from '@/features/tools/xml-formatter/XmlScreen';
import { GitDiffScreen } from '@/features/tools/git-diff-viewer/GitDiffScreen';
import { PasswordScreen } from '@/features/tools/password-generator/PasswordScreen';
import { TotpScreen } from '@/features/tools/totp-generator/TotpScreen';
import { CertScreen } from '@/features/tools/certificate-decoder/CertScreen';
import { QrScreen } from '@/features/tools/qr-code-generator/QrScreen';
import { ApiScreen } from '@/features/tools/api-request-builder/ApiScreen';
import { WsScreen } from '@/features/tools/websocket-tester/WsScreen';
import { HttpStatusScreen } from '@/features/tools/http-status-codes/HttpStatusScreen';
import { NginxScreen } from '@/features/tools/nginx-config-validator/NginxScreen';
import { DockerScreen } from '@/features/tools/docker-command-builder/DockerScreen';
import { DateCalcScreen } from '@/features/tools/date-calculator/DateCalcScreen';
import { FakeDataScreen } from '@/features/tools/fake-data-generator/FakeDataScreen';
import { LoremScreen } from '@/features/tools/lorem-ipsum-generator/LoremScreen';
import { ColorScreen } from '@/features/tools/color-converter/ColorScreen';
import { UnitScreen } from '@/features/tools/unit-converter/UnitScreen';

const ImageScreenLazy = lazy(() =>
  import('@/features/tools/image-converter/ImageScreen').then((m) => ({ default: m.ImageScreen })),
);
const PdfScreenLazy = lazy(() =>
  import('@/features/tools/pdf-tools/PdfScreen').then((m) => ({ default: m.PdfScreen })),
);
const ProtobufScreenLazy = lazy(() =>
  import('@/features/tools/protobuf-decoder/ProtobufScreen').then((m) => ({
    default: m.ProtobufScreen,
  })),
);
const MarkdownScreenLazy = lazy(() =>
  import('@/features/tools/markdown-previewer/MarkdownScreen').then((m) => ({
    default: m.MarkdownScreen,
  })),
);

/**
 * Bespoke workbench screens for tools that don't fit the generic
 * input→output chrome. Each screen owns its layout with shared wb- styles,
 * CodeEditor and the document hooks; the router mounts them with a
 * DocumentContext tab like catalog tools.
 *
 * Heavy screens (image/pdf/protobuf/markdown) are lazy to keep the initial
 * bundle small; the router wraps them in Suspense.
 */
export const CUSTOM_SCREENS: Record<string, ComponentType> = {
  'hash-generator': HashScreen,
  'case-converter': CaseScreen,
  'word-counter': WordScreen,
  'jwt-decoder': JwtScreen,
  'uuid-generator': UuidScreen,
  'cron-parser': CronScreen,
  'crontab-generator': CronScreen,
  'diff-tool': DiffScreen,
  'regex-tester': RegexScreen,
  'json-validator': JsonSchemaScreen,
  'xml-formatter': XmlScreen,
  'markdown-previewer': MarkdownScreenLazy,
  'git-diff-viewer': GitDiffScreen,
  'protobuf-decoder': ProtobufScreenLazy,
  'password-generator': PasswordScreen,
  'totp-generator': TotpScreen,
  'certificate-decoder': CertScreen,
  'qr-code-generator': QrScreen,
  'api-request-builder': ApiScreen,
  'websocket-tester': WsScreen,
  'http-status-codes': HttpStatusScreen,
  'nginx-config-validator': NginxScreen,
  'docker-command-builder': DockerScreen,
  'date-calculator': DateCalcScreen,
  'fake-data-generator': FakeDataScreen,
  'lorem-ipsum-generator': LoremScreen,
  'color-converter': ColorScreen,
  'unit-converter': UnitScreen,
  'image-converter': ImageScreenLazy,
  'pdf-tools': PdfScreenLazy,
};

export const LAZY_CUSTOM_SCREENS = new Set([
  'markdown-previewer',
  'protobuf-decoder',
  'image-converter',
  'pdf-tools',
]);

export function isCustomToolId(id: string): boolean {
  return id in CUSTOM_SCREENS;
}
