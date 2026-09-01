using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using BateauEcole.Api.Models;

namespace BateauEcole.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : IdentityUserContext<User, Guid>(options)
{
    public DbSet<Instructor> Instructors => Set<Instructor>();
    public DbSet<Permit> Permits => Set<Permit>();
    public DbSet<Session> Sessions => Set<Session>();
    public DbSet<Booking> Bookings => Set<Booking>();
    public DbSet<ExamDate> ExamDates => Set<ExamDate>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("users");
            entity.HasIndex(u => u.NormalizedEmail).IsUnique();
            entity.Property(u => u.Role).HasConversion<string>();
            // EF Core migrations don't read C# property initializers — without
            // this, the generated column default would be false, not true.
            entity.Property(u => u.IsActive).HasDefaultValue(true);
        });

        modelBuilder.Entity<IdentityUserClaim<Guid>>().ToTable("user_claims");
        modelBuilder.Entity<IdentityUserLogin<Guid>>().ToTable("user_logins");
        modelBuilder.Entity<IdentityUserToken<Guid>>().ToTable("user_tokens");

        modelBuilder.Entity<RefreshToken>(entity =>
        {
            entity.HasIndex(r => r.TokenHash).IsUnique();

            entity.HasOne(r => r.User)
                .WithMany()
                .HasForeignKey(r => r.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Instructor>()
            .HasOne(i => i.User)
            .WithMany()
            .HasForeignKey(i => i.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Permit>(entity =>
        {
            entity.HasIndex(p => p.Slug).IsUnique();
            entity.Property(p => p.Price).HasPrecision(8, 2);
        });

        modelBuilder.Entity<Session>(entity =>
        {
            entity.Property(s => s.Type).HasConversion<string>();

            entity.HasOne(s => s.Permit)
                .WithMany()
                .HasForeignKey(s => s.PermitId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(s => s.Instructor)
                .WithMany()
                .HasForeignKey(s => s.InstructorId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Booking>(entity =>
        {
            entity.Property(b => b.Status).HasConversion<string>();

            entity.HasOne(b => b.User)
                .WithMany()
                .HasForeignKey(b => b.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(b => b.Session)
                .WithMany()
                .HasForeignKey(b => b.SessionId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
