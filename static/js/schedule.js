let app = {};

let init = app => {
    app.data = {
        status: false
    };

    app.schedule_add = function() {
        this.status = !this.status;
    };

    app.methods = {
        schedule_add: app.schedule_add,
    };

    app.vue = new Vue({
        el: "#entry",
        data: app.data,
        methods: app.methods
    });

    app.init = () => {
        addEventListener("selectstart", e => {
            const el = e.path[1].localName;
            if (el=='th' || el=='td' || el=="tr") {
                e.preventDefault();
            }
        });
        addEventListener("mousedown", e => {
            console.log("e:", e);
        })
    };

    app.init();
}

init(app);