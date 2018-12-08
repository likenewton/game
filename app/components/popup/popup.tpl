
{{if data.isShowBackground}}
<div class="background"></div>
{{/if}}
<div class="outer {{data.type}} {{data.outClass}} {{data.equipment}}" style="{{if data.width}}width: {{data.width}}{{/if}}">
    <div class="inner" style="
    {{if data.width}}width: {{data.width}};{{/if}}
    animation-duration: {{data.animateTime / 1000}}s;">
    	{{if data.type !== 'TIP'}}
        <div class="title">
            <h4>{{data.title || '提示'}}</h4> {{if data.isShowCloseBtn}}
            <span class="close">x</span> {{/if}}
        </div>
        {{/if}}
        {{if data.equipment == 'MOBILE'}}
        <div class="content">{{data.body}}{{data.isShowCloseBtn}}</div>
        {{else if data.equipment == 'COMPUTER'}}
        <div class="content">
            <div class="left fbs-left">
                {{if data.status}}
                <i class="iconfont icon-check-close-circle-o"></i>
                {{else}}
                <i class="iconfont icon-warning-circle-o"></i>
                {{/if}}          
            </div>
            <div class="right fbs-right">{{data.body}}{{data.isShowCloseBtn}}</div>
        </div>
        {{/if}}
        {{if data.type !== 'TIP'}}
        <div class="footer {{if !data.isShowFooter}}hide{{/if}} border-top-1px">
            <span class="sui-btn btn-large cancel-btn {{if !data.isShowCancelBtn}}hide{{/if}} border-right-1px">{{data.cancelBtn}}</span>
            <span class="sui-btn btn-large btn-primary ok-btn {{if !data.isShowOkBtn}}hide{{/if}}">{{data.okBtn}}</span>
        </div>
        {{/if}}
    </div>
</div>