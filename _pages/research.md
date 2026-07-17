---
title: "Research"
layout: single
permalink: /research/
author_profile: true
classes: wide
---

TODO: A short paragraph framing your work, then let the project pages below
carry the detail.

Each project below is its own file in `_research/`. To add one, copy an existing
file and edit the front matter — it shows up here automatically, newest first.

{% for project in site.research reversed %}
  <h2><a href="{{ project.url }}">{{ project.title }}</a></h2>
  {% if project.header.teaser %}
  <a href="{{ project.url }}"><img src="{{ project.header.teaser }}" alt="{{ project.title }}" style="max-width:100%"></a>
  {% endif %}
  <p>{{ project.excerpt }}</p>
{% endfor %}
