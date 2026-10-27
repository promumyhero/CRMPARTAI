CREATE TABLE "activities" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "activities_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"user_id" bigint NOT NULL,
	"title" varchar(255) NOT NULL,
	"category" varchar(100) DEFAULT 'Umum' NOT NULL,
	"location" varchar(255),
	"pic_name" varchar(150),
	"status" smallint DEFAULT 1 NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone,
	"checklist" jsonb DEFAULT '[]'::jsonb,
	"total_estimated_budget" numeric(15, 2) DEFAULT '0' NOT NULL,
	"total_actual_budget" numeric(15, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "autofill_dictionary" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "autofill_dictionary_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"user_id" bigint NOT NULL,
	"field_type" varchar(50) NOT NULL,
	"value_text" varchar(255) NOT NULL,
	"metadata" jsonb,
	"usage_count" integer DEFAULT 1 NOT NULL,
	"last_used_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_autofill_user_field_value" UNIQUE("user_id","field_type","value_text")
);
--> statement-breakpoint
CREATE TABLE "budget_items" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "budget_items_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"activity_id" bigint NOT NULL,
	"category" varchar(100) NOT NULL,
	"item_name" varchar(255) NOT NULL,
	"qty" numeric(10, 2) DEFAULT '1' NOT NULL,
	"unit" varchar(50) NOT NULL,
	"unit_price" numeric(15, 2) DEFAULT '0' NOT NULL,
	"estimated_subtotal" numeric(15, 2) DEFAULT '0' NOT NULL,
	"actual_subtotal" numeric(15, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_templates" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "document_templates_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"user_id" bigint NOT NULL,
	"name" varchar(150) NOT NULL,
	"doc_type" smallint DEFAULT 1 NOT NULL,
	"show_kop" boolean DEFAULT true NOT NULL,
	"header_org_name" varchar(255),
	"header_org_sub" varchar(255),
	"header_org_address" text,
	"header_contact" varchar(255),
	"paper_size" varchar(10) DEFAULT 'A4' NOT NULL,
	"default_opening" text,
	"default_closing" text,
	"signer_title" varchar(150),
	"signer_name" varchar(150),
	"signer_nip" varchar(100),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "documents_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"activity_id" bigint,
	"user_id" bigint NOT NULL,
	"doc_number" varchar(100) NOT NULL,
	"doc_type" smallint NOT NULL,
	"subject" varchar(255) NOT NULL,
	"recipient_name" varchar(255) NOT NULL,
	"content_payload" jsonb NOT NULL,
	"issued_date" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "users_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"name" varchar(150) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"role" varchar(50) DEFAULT 'admin' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "budget_items" ADD CONSTRAINT "budget_items_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_activities_user_start_id" ON "activities" USING btree ("user_id","start_date","id");--> statement-breakpoint
CREATE INDEX "idx_autofill_lookup" ON "autofill_dictionary" USING btree ("user_id","field_type");--> statement-breakpoint
CREATE INDEX "idx_budget_items_activity" ON "budget_items" USING btree ("activity_id");--> statement-breakpoint
CREATE INDEX "idx_documents_user_id" ON "documents" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_documents_activity_id" ON "documents" USING btree ("activity_id");