<div class="rows">
  {{each data.rows as row i}}
  <ul class="cols">
    {{each data.cols as col j}}
    <li class="item">{{i * data.cols.length + j}}</li>
    {{/each}}
  </ul>
  {{/each}}
</div>