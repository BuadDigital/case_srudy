using RealEstateEval.Application.Contracts;
using RealEstateEval.Domain;

namespace RealEstateEval.Application.Abstractions;

public interface ICaseStudyFormService
{
    Task<CaseStudyFormDto?> GetAsync(Guid taskId, bool party, CancellationToken cancellationToken = default);
    Task<CaseStudyFormDto> SaveAsync(
        Guid taskId,
        bool party,
        CaseStudyFormDto form,
        CancellationToken cancellationToken = default);
}
