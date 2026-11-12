import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_invitations_role" AS ENUM('editor', 'admin');
  CREATE TYPE "public"."enum_invitations_status" AS ENUM('pending', 'accepted', 'revoked');
  CREATE TABLE "invitations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"email" varchar NOT NULL,
  	"name" varchar,
  	"role" "enum_invitations_role" DEFAULT 'editor' NOT NULL,
  	"token_hash" varchar,
  	"status" "enum_invitations_status" DEFAULT 'pending' NOT NULL,
  	"expires_at" timestamp(3) with time zone NOT NULL,
  	"accepted_at" timestamp(3) with time zone,
  	"last_sent_at" timestamp(3) with time zone,
  	"invited_by_id" integer,
  	"accepted_user_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "projects_video_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"video_id" integer,
  	"caption" varchar
  );
  
  CREATE TABLE "projects_external_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"url" varchar
  );
  
  CREATE TABLE "projects_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"projects_id" integer
  );
  
  CREATE TABLE "_projects_v_version_video_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"video_id" integer,
  	"caption" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_projects_v_version_external_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"url" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_projects_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"projects_id" integer
  );
  
  ALTER TABLE "projects" ADD COLUMN "objective" varchar;
  ALTER TABLE "projects" ADD COLUMN "challenge" varchar;
  ALTER TABLE "projects" ADD COLUMN "strategy" varchar;
  ALTER TABLE "projects" ADD COLUMN "creative_process" varchar;
  ALTER TABLE "projects" ADD COLUMN "final_solution" varchar;
  ALTER TABLE "_projects_v" ADD COLUMN "version_objective" varchar;
  ALTER TABLE "_projects_v" ADD COLUMN "version_challenge" varchar;
  ALTER TABLE "_projects_v" ADD COLUMN "version_strategy" varchar;
  ALTER TABLE "_projects_v" ADD COLUMN "version_creative_process" varchar;
  ALTER TABLE "_projects_v" ADD COLUMN "version_final_solution" varchar;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "invitations_id" integer;
  ALTER TABLE "invitations" ADD CONSTRAINT "invitations_invited_by_id_users_id_fk" FOREIGN KEY ("invited_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "invitations" ADD CONSTRAINT "invitations_accepted_user_id_users_id_fk" FOREIGN KEY ("accepted_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "projects_video_gallery" ADD CONSTRAINT "projects_video_gallery_video_id_media_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "projects_video_gallery" ADD CONSTRAINT "projects_video_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_external_links" ADD CONSTRAINT "projects_external_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_rels" ADD CONSTRAINT "projects_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_rels" ADD CONSTRAINT "projects_rels_projects_fk" FOREIGN KEY ("projects_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_projects_v_version_video_gallery" ADD CONSTRAINT "_projects_v_version_video_gallery_video_id_media_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_projects_v_version_video_gallery" ADD CONSTRAINT "_projects_v_version_video_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_projects_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_projects_v_version_external_links" ADD CONSTRAINT "_projects_v_version_external_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_projects_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_projects_v_rels" ADD CONSTRAINT "_projects_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_projects_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_projects_v_rels" ADD CONSTRAINT "_projects_v_rels_projects_fk" FOREIGN KEY ("projects_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "invitations_email_idx" ON "invitations" USING btree ("email");
  CREATE INDEX "invitations_token_hash_idx" ON "invitations" USING btree ("token_hash");
  CREATE INDEX "invitations_status_idx" ON "invitations" USING btree ("status");
  CREATE INDEX "invitations_invited_by_idx" ON "invitations" USING btree ("invited_by_id");
  CREATE INDEX "invitations_accepted_user_idx" ON "invitations" USING btree ("accepted_user_id");
  CREATE INDEX "invitations_updated_at_idx" ON "invitations" USING btree ("updated_at");
  CREATE INDEX "invitations_created_at_idx" ON "invitations" USING btree ("created_at");
  CREATE INDEX "projects_video_gallery_order_idx" ON "projects_video_gallery" USING btree ("_order");
  CREATE INDEX "projects_video_gallery_parent_id_idx" ON "projects_video_gallery" USING btree ("_parent_id");
  CREATE INDEX "projects_video_gallery_video_idx" ON "projects_video_gallery" USING btree ("video_id");
  CREATE INDEX "projects_external_links_order_idx" ON "projects_external_links" USING btree ("_order");
  CREATE INDEX "projects_external_links_parent_id_idx" ON "projects_external_links" USING btree ("_parent_id");
  CREATE INDEX "projects_rels_order_idx" ON "projects_rels" USING btree ("order");
  CREATE INDEX "projects_rels_parent_idx" ON "projects_rels" USING btree ("parent_id");
  CREATE INDEX "projects_rels_path_idx" ON "projects_rels" USING btree ("path");
  CREATE INDEX "projects_rels_projects_id_idx" ON "projects_rels" USING btree ("projects_id");
  CREATE INDEX "_projects_v_version_video_gallery_order_idx" ON "_projects_v_version_video_gallery" USING btree ("_order");
  CREATE INDEX "_projects_v_version_video_gallery_parent_id_idx" ON "_projects_v_version_video_gallery" USING btree ("_parent_id");
  CREATE INDEX "_projects_v_version_video_gallery_video_idx" ON "_projects_v_version_video_gallery" USING btree ("video_id");
  CREATE INDEX "_projects_v_version_external_links_order_idx" ON "_projects_v_version_external_links" USING btree ("_order");
  CREATE INDEX "_projects_v_version_external_links_parent_id_idx" ON "_projects_v_version_external_links" USING btree ("_parent_id");
  CREATE INDEX "_projects_v_rels_order_idx" ON "_projects_v_rels" USING btree ("order");
  CREATE INDEX "_projects_v_rels_parent_idx" ON "_projects_v_rels" USING btree ("parent_id");
  CREATE INDEX "_projects_v_rels_path_idx" ON "_projects_v_rels" USING btree ("path");
  CREATE INDEX "_projects_v_rels_projects_id_idx" ON "_projects_v_rels" USING btree ("projects_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_invitations_fk" FOREIGN KEY ("invitations_id") REFERENCES "public"."invitations"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_invitations_id_idx" ON "payload_locked_documents_rels" USING btree ("invitations_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "invitations" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "projects_video_gallery" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "projects_external_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "projects_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_projects_v_version_video_gallery" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_projects_v_version_external_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_projects_v_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "invitations" CASCADE;
  DROP TABLE "projects_video_gallery" CASCADE;
  DROP TABLE "projects_external_links" CASCADE;
  DROP TABLE "projects_rels" CASCADE;
  DROP TABLE "_projects_v_version_video_gallery" CASCADE;
  DROP TABLE "_projects_v_version_external_links" CASCADE;
  DROP TABLE "_projects_v_rels" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_invitations_fk";
  
  DROP INDEX "payload_locked_documents_rels_invitations_id_idx";
  ALTER TABLE "projects" DROP COLUMN "objective";
  ALTER TABLE "projects" DROP COLUMN "challenge";
  ALTER TABLE "projects" DROP COLUMN "strategy";
  ALTER TABLE "projects" DROP COLUMN "creative_process";
  ALTER TABLE "projects" DROP COLUMN "final_solution";
  ALTER TABLE "_projects_v" DROP COLUMN "version_objective";
  ALTER TABLE "_projects_v" DROP COLUMN "version_challenge";
  ALTER TABLE "_projects_v" DROP COLUMN "version_strategy";
  ALTER TABLE "_projects_v" DROP COLUMN "version_creative_process";
  ALTER TABLE "_projects_v" DROP COLUMN "version_final_solution";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "invitations_id";
  DROP TYPE "public"."enum_invitations_role";
  DROP TYPE "public"."enum_invitations_status";`)
}
