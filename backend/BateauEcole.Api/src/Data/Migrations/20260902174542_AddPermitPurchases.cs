using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BateauEcole.Api.src.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddPermitPurchases : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "permit_purchases",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    permit_id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    purchased_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_permit_purchases", x => x.id);
                    table.ForeignKey(
                        name: "fk_permit_purchases_permits_permit_id",
                        column: x => x.permit_id,
                        principalTable: "permits",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_permit_purchases_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "ix_permit_purchases_permit_id",
                table: "permit_purchases",
                column: "permit_id");

            migrationBuilder.CreateIndex(
                name: "ix_permit_purchases_user_id",
                table: "permit_purchases",
                column: "user_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "permit_purchases");
        }
    }
}
