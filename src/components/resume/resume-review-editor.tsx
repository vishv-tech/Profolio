"use client";

import {
  EditorSection,
  EmptySection,
  EntryCard,
  moveItem,
  removeItem,
  replaceItem,
  ReviewField,
  ReviewSelect,
  ReviewTextarea,
  StringListEditor,
} from "@/components/resume/review-primitives";
import type {
  AchievementItem,
  CertificationItem,
  CustomSection,
  CustomSectionItem,
  EducationItem,
  ExperienceItem,
  LanguageItem,
  LinkItem,
  LinkType,
  PortfolioData,
  ProjectItem,
  SkillGroup,
} from "@/types/portfolio";

const LINK_TYPES = [
  "linkedin",
  "github",
  "portfolio",
  "behance",
  "dribbble",
  "medium",
  "youtube",
  "other",
] as const;

const createId = () => crypto.randomUUID();

const createExperience = (): ExperienceItem => ({
  id: createId(),
  company: "",
  role: "",
  employmentType: "",
  location: "",
  startDate: "",
  endDate: "",
  isCurrent: false,
  description: "",
  highlights: [],
});

const createEducation = (): EducationItem => ({
  id: createId(),
  institution: "",
  degree: "",
  fieldOfStudy: "",
  location: "",
  startDate: "",
  endDate: "",
  grade: "",
  description: "",
});

const createProject = (): ProjectItem => ({
  id: createId(),
  name: "",
  description: "",
  technologies: [],
  highlights: [],
  projectUrl: "",
  githubUrl: "",
  startDate: "",
  endDate: "",
});

const createSkillGroup = (): SkillGroup => ({
  id: createId(),
  category: "",
  items: [],
});

const createAchievement = (): AchievementItem => ({
  id: createId(),
  title: "",
  issuer: "",
  date: "",
  description: "",
});

const createCertification = (): CertificationItem => ({
  id: createId(),
  name: "",
  issuer: "",
  issueDate: "",
  expiryDate: "",
  credentialId: "",
  credentialUrl: "",
});

const createLink = (): LinkItem => ({
  id: createId(),
  type: "other",
  label: "",
  url: "",
});

const createLanguage = (): LanguageItem => ({
  id: createId(),
  name: "",
  proficiency: "",
});

const createCustomItem = (): CustomSectionItem => ({
  id: createId(),
  title: "",
  subtitle: "",
  date: "",
  description: "",
});

const createCustomSection = (): CustomSection => ({
  id: createId(),
  title: "",
  items: [],
});

function itemActions<T>(
  items: T[],
  index: number,
  onChange: (items: T[]) => void,
) {
  return {
    onMove: (direction: -1 | 1) =>
      onChange(moveItem(items, index, direction)),
    onRemove: () => onChange(removeItem(items, index)),
  };
}

export function ResumeReviewEditor({
  improveWithAi,
  value,
  onChange,
}: {
  improveWithAi: boolean;
  value: PortfolioData;
  onChange: (value: PortfolioData) => void;
}) {
  return (
    <div className="space-y-6">
      <EditorSection
        description="Confirm the contact details extracted from the resume."
        title="Personal information"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <ReviewField
            label="Full name"
            onChange={(fullName) =>
              onChange({
                ...value,
                personal: { ...value.personal, fullName },
              })
            }
            value={value.personal.fullName}
          />
          <ReviewField
            label="Headline"
            onChange={(headline) =>
              onChange({
                ...value,
                personal: { ...value.personal, headline },
              })
            }
            value={value.personal.headline}
          />
          <ReviewField
            label="Email"
            onChange={(email) =>
              onChange({ ...value, personal: { ...value.personal, email } })
            }
            type="email"
            value={value.personal.email}
          />
          <ReviewField
            label="Phone"
            onChange={(phone) =>
              onChange({ ...value, personal: { ...value.personal, phone } })
            }
            type="tel"
            value={value.personal.phone}
          />
          <ReviewField
            label="Location"
            onChange={(location) =>
              onChange({
                ...value,
                personal: { ...value.personal, location },
              })
            }
            value={value.personal.location}
          />
          <ReviewField
            label="Profile image URL"
            onChange={(profileImageUrl) =>
              onChange({
                ...value,
                personal: { ...value.personal, profileImageUrl },
              })
            }
            type="url"
            value={value.personal.profileImageUrl}
          />
        </div>
      </EditorSection>

      <EditorSection
        description="Keep the summary accurate and grounded in the resume."
        title={
          improveWithAi
            ? "Professional summary · AI improved"
            : "Professional summary"
        }
      >
        <ReviewTextarea
          label="Summary"
          onChange={(summary) => onChange({ ...value, summary })}
          value={value.summary}
        />
      </EditorSection>

      <EditorSection
        actionLabel="Add experience"
        description="Edit, add, remove, or reorder work history."
        onAdd={() =>
          onChange({
            ...value,
            experience: [...value.experience, createExperience()],
          })
        }
        title="Experience"
      >
        {value.experience.length === 0 ? (
          <EmptySection>No experience entries yet.</EmptySection>
        ) : null}
        {value.experience.map((item, index) => {
          const update = (next: ExperienceItem) =>
            onChange({
              ...value,
              experience: replaceItem(value.experience, index, next),
            });

          return (
            <EntryCard
              index={index}
              key={item.id}
              label="Experience"
              total={value.experience.length}
              {...itemActions(value.experience, index, (experience) =>
                onChange({ ...value, experience }),
              )}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <ReviewField
                  label="Company"
                  onChange={(company) => update({ ...item, company })}
                  value={item.company}
                />
                <ReviewField
                  label="Role"
                  onChange={(role) => update({ ...item, role })}
                  value={item.role}
                />
                <ReviewField
                  label="Employment type"
                  onChange={(employmentType) =>
                    update({ ...item, employmentType })
                  }
                  value={item.employmentType}
                />
                <ReviewField
                  label="Location"
                  onChange={(location) => update({ ...item, location })}
                  value={item.location}
                />
                <ReviewField
                  label="Start date"
                  onChange={(startDate) => update({ ...item, startDate })}
                  placeholder="YYYY-MM or YYYY"
                  value={item.startDate}
                />
                <ReviewField
                  label="End date"
                  onChange={(endDate) => update({ ...item, endDate })}
                  placeholder="YYYY-MM or YYYY"
                  value={item.endDate}
                />
              </div>
              <label className="flex w-fit items-center gap-2 text-sm font-medium">
                <input
                  checked={item.isCurrent}
                  className="size-4 rounded border-input"
                  onChange={(event) =>
                    update({
                      ...item,
                      endDate: event.target.checked ? "" : item.endDate,
                      isCurrent: event.target.checked,
                    })
                  }
                  type="checkbox"
                />
                This is a current role
              </label>
              <ReviewTextarea
                label="Description"
                onChange={(description) => update({ ...item, description })}
                value={item.description}
              />
              <StringListEditor
                addLabel="Add highlight"
                label="Highlights"
                onChange={(highlights) => update({ ...item, highlights })}
                values={item.highlights}
              />
            </EntryCard>
          );
        })}
      </EditorSection>

      <EditorSection
        actionLabel="Add education"
        description="Confirm institutions, qualifications, and dates."
        onAdd={() =>
          onChange({
            ...value,
            education: [...value.education, createEducation()],
          })
        }
        title="Education"
      >
        {value.education.length === 0 ? (
          <EmptySection>No education entries yet.</EmptySection>
        ) : null}
        {value.education.map((item, index) => {
          const update = (next: EducationItem) =>
            onChange({
              ...value,
              education: replaceItem(value.education, index, next),
            });

          return (
            <EntryCard
              index={index}
              key={item.id}
              label="Education"
              total={value.education.length}
              {...itemActions(value.education, index, (education) =>
                onChange({ ...value, education }),
              )}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <ReviewField
                  label="Institution"
                  onChange={(institution) => update({ ...item, institution })}
                  value={item.institution}
                />
                <ReviewField
                  label="Degree"
                  onChange={(degree) => update({ ...item, degree })}
                  value={item.degree}
                />
                <ReviewField
                  label="Field of study"
                  onChange={(fieldOfStudy) =>
                    update({ ...item, fieldOfStudy })
                  }
                  value={item.fieldOfStudy}
                />
                <ReviewField
                  label="Location"
                  onChange={(location) => update({ ...item, location })}
                  value={item.location}
                />
                <ReviewField
                  label="Start date"
                  onChange={(startDate) => update({ ...item, startDate })}
                  value={item.startDate}
                />
                <ReviewField
                  label="End date"
                  onChange={(endDate) => update({ ...item, endDate })}
                  value={item.endDate}
                />
                <ReviewField
                  label="Grade"
                  onChange={(grade) => update({ ...item, grade })}
                  value={item.grade}
                />
              </div>
              <ReviewTextarea
                label="Description"
                onChange={(description) => update({ ...item, description })}
                value={item.description}
              />
            </EntryCard>
          );
        })}
      </EditorSection>

      <EditorSection
        actionLabel="Add project"
        description="Review project facts, URLs, technology, and outcomes."
        onAdd={() =>
          onChange({
            ...value,
            projects: [...value.projects, createProject()],
          })
        }
        title="Projects"
      >
        {value.projects.length === 0 ? (
          <EmptySection>No project entries yet.</EmptySection>
        ) : null}
        {value.projects.map((item, index) => {
          const update = (next: ProjectItem) =>
            onChange({
              ...value,
              projects: replaceItem(value.projects, index, next),
            });

          return (
            <EntryCard
              index={index}
              key={item.id}
              label="Project"
              total={value.projects.length}
              {...itemActions(value.projects, index, (projects) =>
                onChange({ ...value, projects }),
              )}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <ReviewField
                  label="Project name"
                  onChange={(name) => update({ ...item, name })}
                  value={item.name}
                />
                <ReviewField
                  label="Project URL"
                  onChange={(projectUrl) => update({ ...item, projectUrl })}
                  type="url"
                  value={item.projectUrl}
                />
                <ReviewField
                  label="GitHub URL"
                  onChange={(githubUrl) => update({ ...item, githubUrl })}
                  type="url"
                  value={item.githubUrl}
                />
                <ReviewField
                  label="Start date"
                  onChange={(startDate) => update({ ...item, startDate })}
                  value={item.startDate}
                />
                <ReviewField
                  label="End date"
                  onChange={(endDate) => update({ ...item, endDate })}
                  value={item.endDate}
                />
              </div>
              <ReviewTextarea
                label="Description"
                onChange={(description) => update({ ...item, description })}
                value={item.description}
              />
              <StringListEditor
                addLabel="Add technology"
                label="Technologies"
                onChange={(technologies) => update({ ...item, technologies })}
                values={item.technologies}
              />
              <StringListEditor
                addLabel="Add highlight"
                label="Highlights"
                onChange={(highlights) => update({ ...item, highlights })}
                values={item.highlights}
              />
            </EntryCard>
          );
        })}
      </EditorSection>

      <EditorSection
        actionLabel="Add skill group"
        description="Group explicit skills without adding unsupported ones."
        onAdd={() =>
          onChange({
            ...value,
            skills: [...value.skills, createSkillGroup()],
          })
        }
        title="Skills"
      >
        {value.skills.length === 0 ? (
          <EmptySection>No skill groups yet.</EmptySection>
        ) : null}
        {value.skills.map((item, index) => {
          const update = (next: SkillGroup) =>
            onChange({
              ...value,
              skills: replaceItem(value.skills, index, next),
            });

          return (
            <EntryCard
              index={index}
              key={item.id}
              label="Skill group"
              total={value.skills.length}
              {...itemActions(value.skills, index, (skills) =>
                onChange({ ...value, skills }),
              )}
            >
              <ReviewField
                label="Category"
                onChange={(category) => update({ ...item, category })}
                value={item.category}
              />
              <StringListEditor
                addLabel="Add skill"
                label="Skills"
                onChange={(items) => update({ ...item, items })}
                values={item.items}
              />
            </EntryCard>
          );
        })}
      </EditorSection>

      <EditorSection
        actionLabel="Add achievement"
        description="Review awards and achievements explicitly present."
        onAdd={() =>
          onChange({
            ...value,
            achievements: [...value.achievements, createAchievement()],
          })
        }
        title="Achievements"
      >
        {value.achievements.length === 0 ? (
          <EmptySection>No achievements yet.</EmptySection>
        ) : null}
        {value.achievements.map((item, index) => {
          const update = (next: AchievementItem) =>
            onChange({
              ...value,
              achievements: replaceItem(value.achievements, index, next),
            });

          return (
            <EntryCard
              index={index}
              key={item.id}
              label="Achievement"
              total={value.achievements.length}
              {...itemActions(value.achievements, index, (achievements) =>
                onChange({ ...value, achievements }),
              )}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <ReviewField
                  label="Title"
                  onChange={(title) => update({ ...item, title })}
                  value={item.title}
                />
                <ReviewField
                  label="Issuer"
                  onChange={(issuer) => update({ ...item, issuer })}
                  value={item.issuer}
                />
                <ReviewField
                  label="Date"
                  onChange={(date) => update({ ...item, date })}
                  value={item.date}
                />
              </div>
              <ReviewTextarea
                label="Description"
                onChange={(description) => update({ ...item, description })}
                value={item.description}
              />
            </EntryCard>
          );
        })}
      </EditorSection>

      <EditorSection
        actionLabel="Add certification"
        description="Confirm certification issuers and credential details."
        onAdd={() =>
          onChange({
            ...value,
            certifications: [
              ...value.certifications,
              createCertification(),
            ],
          })
        }
        title="Certifications"
      >
        {value.certifications.length === 0 ? (
          <EmptySection>No certifications yet.</EmptySection>
        ) : null}
        {value.certifications.map((item, index) => {
          const update = (next: CertificationItem) =>
            onChange({
              ...value,
              certifications: replaceItem(value.certifications, index, next),
            });

          return (
            <EntryCard
              index={index}
              key={item.id}
              label="Certification"
              total={value.certifications.length}
              {...itemActions(
                value.certifications,
                index,
                (certifications) => onChange({ ...value, certifications }),
              )}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <ReviewField
                  label="Name"
                  onChange={(name) => update({ ...item, name })}
                  value={item.name}
                />
                <ReviewField
                  label="Issuer"
                  onChange={(issuer) => update({ ...item, issuer })}
                  value={item.issuer}
                />
                <ReviewField
                  label="Issue date"
                  onChange={(issueDate) => update({ ...item, issueDate })}
                  value={item.issueDate}
                />
                <ReviewField
                  label="Expiry date"
                  onChange={(expiryDate) => update({ ...item, expiryDate })}
                  value={item.expiryDate}
                />
                <ReviewField
                  label="Credential ID"
                  onChange={(credentialId) =>
                    update({ ...item, credentialId })
                  }
                  value={item.credentialId}
                />
                <ReviewField
                  label="Credential URL"
                  onChange={(credentialUrl) =>
                    update({ ...item, credentialUrl })
                  }
                  type="url"
                  value={item.credentialUrl}
                />
              </div>
            </EntryCard>
          );
        })}
      </EditorSection>

      <EditorSection
        actionLabel="Add link"
        description="Check every URL and its destination type."
        onAdd={() =>
          onChange({ ...value, links: [...value.links, createLink()] })
        }
        title="Links"
      >
        {value.links.length === 0 ? (
          <EmptySection>No links yet.</EmptySection>
        ) : null}
        {value.links.map((item, index) => {
          const update = (next: LinkItem) =>
            onChange({
              ...value,
              links: replaceItem(value.links, index, next),
            });

          return (
            <EntryCard
              index={index}
              key={item.id}
              label="Link"
              total={value.links.length}
              {...itemActions(value.links, index, (links) =>
                onChange({ ...value, links }),
              )}
            >
              <div className="grid gap-4 sm:grid-cols-3">
                <ReviewSelect
                  label="Type"
                  onChange={(type) =>
                    update({ ...item, type: type as LinkType })
                  }
                  options={LINK_TYPES}
                  value={item.type}
                />
                <ReviewField
                  label="Label"
                  onChange={(label) => update({ ...item, label })}
                  value={item.label}
                />
                <ReviewField
                  label="URL"
                  onChange={(url) => update({ ...item, url })}
                  type="url"
                  value={item.url}
                />
              </div>
            </EntryCard>
          );
        })}
      </EditorSection>

      <EditorSection
        actionLabel="Add language"
        description="Include only languages stated in the resume."
        onAdd={() =>
          onChange({
            ...value,
            languages: [...value.languages, createLanguage()],
          })
        }
        title="Languages"
      >
        {value.languages.length === 0 ? (
          <EmptySection>No languages yet.</EmptySection>
        ) : null}
        {value.languages.map((item, index) => {
          const update = (next: LanguageItem) =>
            onChange({
              ...value,
              languages: replaceItem(value.languages, index, next),
            });

          return (
            <EntryCard
              index={index}
              key={item.id}
              label="Language"
              total={value.languages.length}
              {...itemActions(value.languages, index, (languages) =>
                onChange({ ...value, languages }),
              )}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <ReviewField
                  label="Language"
                  onChange={(name) => update({ ...item, name })}
                  value={item.name}
                />
                <ReviewField
                  label="Proficiency"
                  onChange={(proficiency) =>
                    update({ ...item, proficiency })
                  }
                  value={item.proficiency}
                />
              </div>
            </EntryCard>
          );
        })}
      </EditorSection>

      <EditorSection
        description="Add, remove, edit, or reorder interests."
        title="Interests"
      >
        <StringListEditor
          addLabel="Add interest"
          label="Interests"
          onChange={(interests) => onChange({ ...value, interests })}
          values={value.interests}
        />
      </EditorSection>

      <EditorSection
        actionLabel="Add custom section"
        description="Keep additional resume content that does not fit elsewhere."
        onAdd={() =>
          onChange({
            ...value,
            customSections: [...value.customSections, createCustomSection()],
          })
        }
        title="Custom sections"
      >
        {value.customSections.length === 0 ? (
          <EmptySection>No custom sections yet.</EmptySection>
        ) : null}
        {value.customSections.map((section, sectionIndex) => {
          const updateSection = (next: CustomSection) =>
            onChange({
              ...value,
              customSections: replaceItem(
                value.customSections,
                sectionIndex,
                next,
              ),
            });

          return (
            <EntryCard
              index={sectionIndex}
              key={section.id}
              label="Custom section"
              total={value.customSections.length}
              {...itemActions(
                value.customSections,
                sectionIndex,
                (customSections) => onChange({ ...value, customSections }),
              )}
            >
              <ReviewField
                label="Section title"
                onChange={(title) => updateSection({ ...section, title })}
                value={section.title}
              />
              <div className="space-y-3 border-l-2 pl-3 sm:pl-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-semibold">Section items</p>
                  <button
                    className="text-sm font-medium underline underline-offset-4"
                    onClick={() =>
                      updateSection({
                        ...section,
                        items: [...section.items, createCustomItem()],
                      })
                    }
                    type="button"
                  >
                    Add item
                  </button>
                </div>
                {section.items.length === 0 ? (
                  <EmptySection>No items in this section yet.</EmptySection>
                ) : null}
                {section.items.map((item, itemIndex) => {
                  const updateItem = (next: CustomSectionItem) =>
                    updateSection({
                      ...section,
                      items: replaceItem(section.items, itemIndex, next),
                    });

                  return (
                    <EntryCard
                      index={itemIndex}
                      key={item.id}
                      label="Section item"
                      total={section.items.length}
                      {...itemActions(
                        section.items,
                        itemIndex,
                        (items) => updateSection({ ...section, items }),
                      )}
                    >
                      <div className="grid gap-4 sm:grid-cols-2">
                        <ReviewField
                          label="Title"
                          onChange={(title) => updateItem({ ...item, title })}
                          value={item.title}
                        />
                        <ReviewField
                          label="Subtitle"
                          onChange={(subtitle) =>
                            updateItem({ ...item, subtitle })
                          }
                          value={item.subtitle}
                        />
                        <ReviewField
                          label="Date"
                          onChange={(date) => updateItem({ ...item, date })}
                          value={item.date}
                        />
                      </div>
                      <ReviewTextarea
                        label="Description"
                        onChange={(description) =>
                          updateItem({ ...item, description })
                        }
                        value={item.description}
                      />
                    </EntryCard>
                  );
                })}
              </div>
            </EntryCard>
          );
        })}
      </EditorSection>
    </div>
  );
}
