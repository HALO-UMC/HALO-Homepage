import { useState } from "react";

import { teamGroups } from "../data/teamData";
import "./TeamShowcase.css";

const FALLBACK_IMAGE =
  "https://picsum.photos/seed/halo-team-fallback/800/1000";

function TeamImage({ src, alt }) {
  const [imageSource, setImageSource] = useState(src);

  const handleError = () => {
    if (imageSource === FALLBACK_IMAGE) {
      return;
    }

    setImageSource(FALLBACK_IMAGE);
  };

  return (
    <img
      src={imageSource}
      alt={alt}
      onError={handleError}
      loading="lazy"
    />
  );
}

function MemberArrowIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 12H19"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />

      <path
        d="M14 7L19 12L14 17"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TeamMemberCard({ member, groupCode }) {
  return (
    <article className="team-profile-card">
      <div className="team-profile-card__image">
        <TeamImage
          src={member.image}
          alt={`${member.name} ${member.role} 프로필`}
        />

        <div className="team-profile-card__image-shade" />

        <div className="team-profile-card__image-top">
          <span>{groupCode}</span>

          {member.isLead && (
            <span className="team-profile-card__lead">
              {member.position}
            </span>
          )}
        </div>

        <div className="team-profile-card__image-bottom">
          <span>{member.englishName}</span>
        </div>
      </div>

      <div className="team-profile-card__content">
        <div className="team-profile-card__identity">
          <div>
            <h4>{member.name}</h4>
            <p>{member.role}</p>
          </div>

          <div className="team-profile-card__arrow">
            <MemberArrowIcon />
          </div>
        </div>

        <p className="team-profile-card__description">
          {member.description}
        </p>
      </div>
    </article>
  );
}

function TeamGroup({ group, index }) {
  return (
    <section className="team-showcase-group">
      <div className="team-showcase-group__header">
        <div className="team-showcase-group__number">
          {String(index + 1).padStart(2, "0")}
        </div>

        <div className="team-showcase-group__title">
          <span>{group.code}</span>
          <h3>{group.title}</h3>
        </div>

        <p>{group.description}</p>
      </div>

      <div
        className={`team-showcase-members team-showcase-members--${group.members.length}`}
      >
        {group.members.map((member) => (
          <TeamMemberCard
            key={member.id}
            member={member}
            groupCode={group.code}
          />
        ))}
      </div>
    </section>
  );
}

function TeamShowcase() {
  return (
    <section className="team-showcase" id="team">
      <div className="team-showcase__background">
        <div className="team-showcase__orbit team-showcase__orbit--one" />
        <div className="team-showcase__orbit team-showcase__orbit--two" />
      </div>

      <div className="container team-showcase__inner">
        <header className="team-showcase__header">
          <div>
            <span className="team-showcase__eyebrow">
              TEAM HALO
            </span>

            <h2>
              하나의 경험을 만드는
              <br />
              <strong>서로 다른 전문성</strong>
            </h2>
          </div>

          <div className="team-showcase__introduction">
            <p>
              기획과 디자인, Android와 Spring Boot가 하나의 기준으로
              HALO의 경험을 만들어갑니다.
            </p>

            <span>
              PRODUCT · DESIGN · TECHNOLOGY
            </span>
          </div>
        </header>

        <div className="team-showcase__groups">
          {teamGroups.map((group, index) => (
            <TeamGroup
              key={group.id}
              group={group}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default TeamShowcase;