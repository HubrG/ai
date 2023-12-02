import { PrismaClient } from "@prisma/client";

declare module "node" {
  interface Global {
    prisma?: PrismaClient;
  }
}

declare module 'bcrypt';

declare module 'js-cookie';
declare module 'validator';
declare module 'bcrypt';

declare module 'react-places-autocomplete'

declare module "uuid"
declare module 'cookie';
declare module 'showdown';
declare module 'react-resizable';
declare module 'lodash'
declare module 'react-lazyload'

declare module "@/utils/openAIStream"

declare module "tiktoken"
declare module "@dqbd/tiktoken"

declare module "isomorphic-fetch"
declare module "unified"
declare module "remark-parse"
declare module "uuid"

declare module '@adobe/helix-md2docx';
