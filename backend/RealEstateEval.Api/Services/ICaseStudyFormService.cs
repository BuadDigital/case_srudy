using RealEstateEval.Api.Contracts;

namespace RealEstateEval.Api.Services;

public interface ICaseStudyFormService
{
    Task<CaseStudyFormDto?> GetAsync(Guid taskId, bool party, CancellationToken cancellationToken = default);
    Task<CaseStudyFormDto> SaveAsync(
        Guid taskId,
        bool party,
        CaseStudyFormDto form,
        CancellationToken cancellationToken = default);
}
