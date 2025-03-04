// import { Model } from '@nozbe/watermelondb';
// import { field, text } from '@nozbe/watermelondb/decorators';

// export default class Client extends Model {
//   static table = 'clients';

//   @text('name') name!: string;
//   @text('email') email!: string;
//   @text('job') job!: string;
//   @field('rate') rate!: number;
//   @field('is_active') isActive!: boolean;
//   @text('sync_status') customSyncStatus!: string;  
//   @field('version') version!: number;
//   @field('updated_at') updatedAt!: number;
//   @text('created_at') createdAt!: number;
// }


import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

export default class Client extends Model {
  static table = 'clients';

  @field('name') name: string;
  @field('email') email: string;
  @field('job') job: string;
  @field('rate') rate: string;
  @field('is_active') is_active: boolean | null;
  @field('custom_sync_status') custom_sync_status: string;  // Changed from sync_status
  @field('version') version: number;
  @field('updated_at') updated_at: number;
  @field('created_at') created_at: number;
  @field('deleted_at') deleted_at?: number;
}







