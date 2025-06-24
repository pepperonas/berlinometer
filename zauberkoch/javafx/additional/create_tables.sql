create table if not exists password_reset_tokens
(
    user_id     int          null,
    token       varchar(255) null,
    expiry_date datetime     null
);

create table if not exists users
(
    id                       int auto_increment
        primary key,
    active                   int          default 1                 null,
    admin                    int          default 0                 null,
    username                 varchar(255)                           not null,
    email                    varchar(255)                           not null,
    password                 text                                   null,
    google_oauth2            int          default 0                 null,
    first_name               varchar(255)                           null,
    last_name                varchar(255)                           null,
    birth_date               date                                   null,
    gender                   varchar(50)                            null,
    weight                   decimal(3, 2)                          null,
    nationality              int                                    null,
    created                  timestamp    default CURRENT_TIMESTAMP null,
    last_seen                timestamp    default CURRENT_TIMESTAMP null,
    premium_expiration       timestamp    default CURRENT_TIMESTAMP null,
    subscription_id          varchar(255)                           null,
    completed_questionnaire  int          default 0                 not null,
    date_of_birth            date                                   null,
    verified                 int                                    null,
    current_usage_count      int          default 0                 null,
    current_usage_count_flag int          default 1                 null,
    theme                    varchar(255) default 'light'           null,
    constraint email
        unique (email),
    constraint username
        unique (username)
);

create table if not exists api_logs
(
    id             bigint auto_increment
        primary key,
    user_id        int                                null,
    prompt         text                               null,
    response       text                               null,
    created        datetime default CURRENT_TIMESTAMP null,
    starred        int      default 0                 not null,
    focus_phrase   text                               null,
    rec_uuid       text                               null,
    api            varchar(255)                       null,
    execution_time bigint                             null,
    constraint exec_user_id_fk
        foreign key (user_id) references users (id)
            on delete cascade
);

create table if not exists api_rate_limits
(
    id      bigint                             not null
        primary key,
    user_id int                                null,
    count   int                                null,
    updated datetime default CURRENT_TIMESTAMP null,
    constraint user_flooded_user_id_fk
        foreign key (user_id) references users (id)
);

create table if not exists recipes
(
    id               bigint auto_increment
        primary key,
    user_id          int                                  not null,
    api_log_id       bigint                               null,
    title            varchar(255)                         not null,
    preparation_time varchar(50)                          null,
    cost             varchar(50)                          null,
    servings         int                                  null,
    instructions     text                                 not null,
    tips             text                                 null,
    important_notes  text                                 null,
    created_at       timestamp  default CURRENT_TIMESTAMP null,
    updated_at       timestamp  default CURRENT_TIMESTAMP null on update CURRENT_TIMESTAMP,
    is_favorite      tinyint(1) default 0                 null,
    constraint fk_recipe_api_log
        foreign key (api_log_id) references api_logs (id)
            on delete set null,
    constraint fk_recipe_user
        foreign key (user_id) references users (id)
            on delete cascade
);

create table if not exists recipe_ingredients
(
    id        bigint auto_increment
        primary key,
    recipe_id bigint       not null,
    name      varchar(255) not null,
    quantity  varchar(50)  null,
    unit      varchar(50)  null,
    constraint fk_ingredient_recipe
        foreign key (recipe_id) references recipes (id)
            on delete cascade
);

create index idx_ingredient_name
    on recipe_ingredients (name);

create index idx_recipe_user
    on recipes (user_id);

create table if not exists referrals
(
    id            bigint auto_increment
        primary key,
    referral_code varchar(384)                        not null,
    user_id       int                                 not null,
    usage_count   int       default 0                 null,
    created_at    timestamp default CURRENT_TIMESTAMP null,
    constraint referral_code
        unique (referral_code),
    constraint referrals_ibfk_1
        foreign key (user_id) references users (id)
            on delete cascade
);

create index referrer_id
    on referrals (user_id);

create table if not exists user_settings
(
    id                     int auto_increment
        primary key,
    user_id                int                                    not null,
    updated                datetime     default CURRENT_TIMESTAMP null,
    rg_type                varchar(255) default 'Ich esse alles'  null,
    rg_goal                varchar(255)                           null,
    rg_api                 varchar(255) default 'chat_gpt'        not null,
    slider_shop            int          default 2                 null,
    slider_duration        int          default 2                 null,
    slider_cost            int          default 2                 null,
    slider_portions        int          default 2                 null,
    cbx_get_thin           int          default 0                 null,
    cbx_get_heavy          int          default 0                 null,
    cbx_get_muscles        int          default 0                 null,
    cbx_get_healthy        int          default 0                 null,
    expandable_layout_open int          default 1                 null,
    request_json           int          default 1                 null,
    theme                  varchar(255) default 'light'           null,
    constraint user_pref_config_pk
        unique (user_id),
    constraint user_pref_config_user_id_fk
        foreign key (user_id) references users (id)
);

create table if not exists users_food_preferences
(
    id       bigint auto_increment
        primary key,
    user_id  int  null,
    food     text null,
    is_liked int  null,
    constraint unique_user_food
        unique (user_id, food(255)),
    constraint users_food_list_config_user_id_fk
        foreign key (user_id) references users (id)
);

create table if not exists verification_tokens
(
    user_id     int null,
    expiry_date int null,
    token       int null
);

