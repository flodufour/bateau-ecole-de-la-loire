using Microsoft.EntityFrameworkCore;
using BateauEcole.Api.Models;

namespace BateauEcole.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Instructor> Instructors => Set<Instructor>();
    public DbSet<Permit> Permits => Set<Permit>();
    public DbSet<Session> Sessions => Set<Session>();
    public DbSet<Booking> Bookings => Set<Booking>();
    public DbSet<ExamDate> ExamDates => Set<ExamDate>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(u => u.Email).IsUnique();
            entity.Property(u => u.Role).HasConversion<string>();
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
